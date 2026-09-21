#!/usr/bin/env python3
"""
Codemod: replace hardcoded display-date formatting (date-fns `format(...)`
and `moment(...).format(...)`) with the shared formatDate()/formatDateTime()
utility from '@/utilities/formatters', so every page automatically respects
the global Display Settings.

Conservative by design: only rewrites patterns we are CONFIDENT are pure
display formatting (dd-MM-yyyy / DD-MM-YYYY / dd/MM/yyyy style, optionally
with HH:mm). Anything ambiguous (ISO yyyy-MM-dd used for <input> values or
API params, compact filename formats, toLocaleDateString with locale
options, etc.) is left untouched and written to a report for manual review.

Usage:
    python3 codemod_dates.py <src_root>
Writes fixed files in place (only files that changed) and prints/writes a report.
"""
import os
import re
import sys
import json

# Format strings we are confident are pure DATE display -> formatDate(expr)
DATE_ONLY_SAFE = {
    "dd-MM-yyyy", "dd/MM/yyyy",
    "DD-MM-YYYY", "DD/MM/YYYY",
    "DD MMM YYYY", "dd MMM yyyy",
}
# Format strings we are confident are DATE + TIME display -> formatDateTime(expr)
DATETIME_SAFE = {
    "dd-MM-yyyy HH:mm", "DD-MM-YYYY HH:mm",
    "dd/MM/yyyy HH:mm", "DD/MM/YYYY HH:mm",
}

CURRENCY_LOCALES_SAFE = {"en-IN"}

SKIP_EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build"}


def find_matching_paren(s, open_idx):
    """s[open_idx] must be '('. Return index of the matching ')'."""
    depth = 0
    i = open_idx
    while i < len(s):
        if s[i] == '(':
            depth += 1
        elif s[i] == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def split_top_level_args(s):
    """Split a comma-separated arg string on top-level commas only."""
    args, depth, cur = [], 0, ''
    in_str = None
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            cur += c
            if c == in_str and s[i - 1] != '\\':
                in_str = None
        elif c in "'\"`":
            in_str = c
            cur += c
        elif c in '([{':
            depth += 1
            cur += c
        elif c in ')]}':
            depth -= 1
            cur += c
        elif c == ',' and depth == 0:
            args.append(cur.strip())
            cur = ''
        else:
            cur += c
        i += 1
    if cur.strip():
        args.append(cur.strip())
    return args


def extract_quoted(s):
    m = re.match(r"""^['"`](.+)['"`]$""", s.strip())
    return m.group(1) if m else None


def is_commented_line(content, pos):
    """True if `pos` sits on a line that is a // line-comment (commented-out
    dead code) -- we must never rewrite inside comments, it can garble
    multi-line commented blocks."""
    line_start = content.rfind('\n', 0, pos) + 1
    line_end = content.find('\n', pos)
    if line_end == -1:
        line_end = len(content)
    line = content[line_start:line_end]
    return line.lstrip().startswith('//')


def find_matching_brace(s, open_idx):
    """s[open_idx] must be '{'. Return index of matching '}'."""
    depth = 0
    i = open_idx
    while i < len(s):
        if s[i] == '{':
            depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def collect_format_strings_in_body(body):
    """Find every format(...)/moment(...).format(...) call inside `body`
    (via the same balanced-paren logic used elsewhere) and return the list
    of format-string literals used, or None if a call couldn't be parsed."""
    fmts = []
    # date-fns style: format(EXPR, 'FMT')
    i = 0
    while True:
        m = re.compile(r'\bformat\(').search(body, i)
        if not m:
            break
        open_idx = m.end() - 1
        close_idx = find_matching_paren(body, open_idx)
        if close_idx == -1:
            return None
        args = split_top_level_args(body[open_idx + 1:close_idx])
        if len(args) == 2:
            fmt = extract_quoted(args[1])
            if fmt is not None:
                fmts.append(fmt)
        i = close_idx + 1

    # moment style: moment(EXPR).format('FMT')
    i = 0
    while True:
        m = re.compile(r'\bmoment\(').search(body, i)
        if not m:
            break
        open_idx = m.end() - 1
        close_idx = find_matching_paren(body, open_idx)
        if close_idx == -1:
            return None
        rest = body[close_idx + 1:]
        fmt_call = re.match(r'\s*\.format\(', rest)
        if fmt_call:
            fmt_open = close_idx + 1 + fmt_call.end() - 1
            fmt_close = find_matching_paren(body, fmt_open)
            if fmt_close == -1:
                return None
            fmt = extract_quoted(body[fmt_open + 1:fmt_close].strip())
            if fmt is not None:
                fmts.append(fmt)
            i = fmt_close + 1
        else:
            i = close_idx + 1
    return fmts


def strip_recursion_risk_wrappers(content, stripped, manual_review_wrappers):
    """Remove locally-defined `const formatDate = (...) => { ... }` /
    `const formatDateTime = (...) => { ... }` wrapper functions whose body
    is PROVABLY just a re-implementation of the shared formatter (every
    format(...)/moment(...).format(...) call inside uses a format string in
    our safe list, matching the wrapper's own name). These are exactly the
    functions that create infinite self-recursion once call sites elsewhere
    in the file get rewritten to call formatDate()/formatDateTime() (which
    then resolves to this same local shadow instead of the shared import).

    Wrappers that use toLocaleDateString/getMonth()/etc. (no safe
    format()/moment().format() calls found) are left completely untouched
    and reported separately for manual review -- we never guess there.
    """
    pattern = re.compile(r'(?:const|let)\s+(formatDate|formatDateTime)\s*=\s*\([^)]*\)\s*(?::[^=]+?)?=>\s*')
    i = 0
    out = []
    while i < len(content):
        m = pattern.search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        if is_commented_line(content, start):
            out.append(content[i:m.end()])
            i = m.end()
            continue

        brace_idx = content.find('{', m.end())
        # only handle block-bodied arrow functions; require it directly follows (allow whitespace/newlines)
        between = content[m.end():brace_idx] if brace_idx != -1 else ''
        if brace_idx == -1 or not re.match(r'^\s*$', between):
            # concise-body (no braces) -- don't touch, just note for review
            manual_review_wrappers.append((content.count('\n', 0, start) + 1, m.group(1), 'concise-body (no braces) — custom implementation, not auto-handled'))
            out.append(content[i:m.end()])
            i = m.end()
            continue

        close_brace = find_matching_brace(content, brace_idx)
        if close_brace == -1:
            out.append(content[i:m.end()])
            i = m.end()
            continue

        # find the terminating `;` (optional) right after the closing brace
        after = content[close_brace + 1:]
        semi_match = re.match(r'\s*;?', after)
        end_of_stmt = close_brace + 1 + semi_match.end()

        name = m.group(1)
        body = content[brace_idx + 1:close_brace]
        fmts = collect_format_strings_in_body(body)
        line_no = content.count('\n', 0, start) + 1

        safe_set = DATE_ONLY_SAFE if name == 'formatDate' else DATETIME_SAFE
        if fmts and all(f in safe_set for f in fmts):
            # Safe to strip entirely -- shared import will take over.
            stripped.append((line_no, name))
            out.append(content[i:start])
            i = end_of_stmt
        else:
            reason = ('no format()/moment().format() calls found — custom implementation'
                      if not fmts else
                      f"uses format string(s) {sorted(set(fmts) - safe_set)} not in the safe set for {name}")
            manual_review_wrappers.append((line_no, name, reason))
            out.append(content[i:end_of_stmt])
            i = end_of_stmt
    return ''.join(out)


def is_intl_currency_options(opts_text):
    """True if an Intl.NumberFormat options object clearly configures a
    currency display (style: 'currency', currency: 'INR')."""
    has_style = re.search(r"""style\s*:\s*['"]currency['"]""", opts_text)
    has_inr = re.search(r"""currency\s*:\s*['"]INR['"]""", opts_text)
    return bool(has_style and has_inr)


def strip_currency_wrapper_functions(content, stripped, manual_review_wrappers):
    """Remove locally-defined `const formatCurrency = (...) => {...}` when
    the body is PROVABLY just a hardcoded-INR re-implementation of the
    shared formatCurrency(). Mirrors strip_recursion_risk_wrappers for
    dates -- same rationale: leaving the local shadow in place would make
    later call-site rewrites recurse into themselves.

    Two recognised safe shapes for formatCurrency's body:
      A) return new Intl.NumberFormat(<locale>, {style:'currency', currency:'INR', ...}).format(EXPR);
      B) return '₹ ' + OTHER(EXPR);   or   return `₹ ${OTHER(EXPR)}`;   or   return `₹${OTHER(EXPR)}`;
         where OTHER is a bare identifier call (typically a local formatAmount helper).

    Returns (new_content, helper_candidates) where helper_candidates is the
    list of OTHER names from any Shape-B removals -- a separate pass then
    decides whether those helpers are now unused and can be removed too.
    """
    pattern = re.compile(r'(?:const|let)\s+formatCurrency\s*=\s*\([^)]*\)\s*(?::[^=]+?)?=>\s*')
    i = 0
    out = []
    helper_candidates = []
    while i < len(content):
        m = pattern.search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        if is_commented_line(content, start):
            out.append(content[i:m.end()])
            i = m.end()
            continue

        brace_idx = content.find('{', m.end())
        between = content[m.end():brace_idx] if brace_idx != -1 else ''
        if brace_idx == -1 or not re.match(r'^\s*$', between):
            manual_review_wrappers.append((content.count('\n', 0, start) + 1, 'formatCurrency', 'concise-body — custom implementation, not auto-handled'))
            out.append(content[i:m.end()])
            i = m.end()
            continue

        close_brace = find_matching_brace(content, brace_idx)
        if close_brace == -1:
            out.append(content[i:m.end()])
            i = m.end()
            continue

        after = content[close_brace + 1:]
        semi_match = re.match(r'\s*;?', after)
        end_of_stmt = close_brace + 1 + semi_match.end()

        body = content[brace_idx + 1:close_brace].strip()
        line_no = content.count('\n', 0, start) + 1

        safe = False
        other_helper_name = None

        # Shape A: return new Intl.NumberFormat(LOCALE, {...}).format(EXPR);
        m_intl = re.match(
            r"""return\s+new\s+Intl\.NumberFormat\(\s*['"]([\w-]+)['"]\s*,\s*""",
            body,
        )
        if m_intl and m_intl.group(1) in CURRENCY_LOCALES_SAFE:
            opts_open = body.find('{', m_intl.end() - 1)
            if opts_open != -1:
                opts_close = find_matching_brace(body, opts_open)
                if opts_close != -1 and is_intl_currency_options(body[opts_open:opts_close + 1]):
                    rest = body[opts_close + 1:]
                    if re.match(r"""^\s*\)\s*\.format\([^)]*\)\s*;?\s*$""", rest):
                        safe = True

        # Shape B: return '₹ ' + OTHER(x);  or  return `₹ ${OTHER(x)}`;  or  return `₹${OTHER(x)}`;
        if not safe:
            m_b = re.match(
                r"""return\s+(?:'₹\s?'\s*\+\s*(\w+)\([^)]*\)|`₹\s?\$\{\s*(\w+)\([^)]*\)\s*\}`)\s*;?\s*$""",
                body,
            )
            if m_b:
                other_helper_name = m_b.group(1) or m_b.group(2)
                safe = True

        if safe:
            stripped.append((line_no, 'formatCurrency'))
            if other_helper_name:
                helper_candidates.append(other_helper_name)
            out.append(content[i:start])
            i = end_of_stmt
        else:
            reason = "does not exactly match the shared formatCurrency() re-implementation shape — custom logic, needs manual review"
            manual_review_wrappers.append((line_no, 'formatCurrency', reason))
            out.append(content[i:end_of_stmt])
            i = end_of_stmt
    return ''.join(out), helper_candidates


def strip_unused_currency_helpers(content, helper_names, stripped):
    """After formatCurrency wrappers are stripped, remove any helper (e.g.
    a local formatAmount) they privately depended on, IF that helper is not
    referenced anywhere else in the file (only its own definition site
    would remain)."""
    for name in set(helper_names):
        occurrences = len(re.findall(r'\b' + re.escape(name) + r'\s*\(', content))
        if occurrences != 0:
            continue  # still called somewhere else in the file -- leave it
        pat = re.compile(r'(?:const|let)\s+' + re.escape(name) + r'\s*=\s*\([^)]*\)\s*(?::[^=]+?)?=>\s*\{')
        hm = pat.search(content)
        if not hm or is_commented_line(content, hm.start()):
            continue
        h_brace = hm.end() - 1
        h_close = find_matching_brace(content, h_brace)
        if h_close == -1:
            continue
        after = content[h_close + 1:]
        semi = re.match(r'\s*;?', after)
        h_end = h_close + 1 + semi.end()
        line_no = content.count('\n', 0, hm.start()) + 1
        stripped.append((line_no, name))
        content = content[:hm.start()] + content[h_end:]
    return content


RUPEE_INTERP_RE = re.compile(r'₹\s?(\$?\{)')


def replace_rupee_interpolations(content, changes, review):
    """Find `₹{EXPR}` (JSX) / `₹${EXPR}` (template literal) where EXPR is
    PROVABLY a raw numeric expression ending in exactly `.toFixed(2)` or
    `.toLocaleString('en-IN')` with nothing else trailing (no `?.` +
    fallback, no extra formatting options we can't verify). Those get
    rewritten to `{formatCurrency(BASE)}` / `${formatCurrency(BASE)}`.
    Anything else containing a bare ₹ is left completely untouched and
    logged for manual review -- currency correctness is too important to
    guess at.
    """
    out = []
    i = 0
    n = len(content)
    while i < n:
        m = RUPEE_INTERP_RE.search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        if is_commented_line(content, start):
            out.append(content[i:m.end()])
            i = m.end()
            continue

        is_template = m.group(1) == '${'
        brace_idx = m.end() - 1  # index of the '{'
        close_idx = find_matching_brace(content, brace_idx)
        line_no = content.count('\n', 0, start) + 1
        if close_idx == -1:
            out.append(content[i:m.end()])
            i = m.end()
            continue

        inner = content[brace_idx + 1:close_idx]
        full_span = content[start:close_idx + 1]

        base = None
        mm = re.match(r'^\s*(.+?)\.toFixed\(\s*2\s*\)\s*$', inner, re.DOTALL)
        if mm:
            base = mm.group(1).strip()
        else:
            mm = re.match(r"""^\s*(.+?)\.toLocaleString\(\s*['"]en-IN['"]\s*\)\s*$""", inner, re.DOTALL)
            if mm:
                base = mm.group(1).strip()

        out.append(content[i:start])
        if base is not None:
            replacement = ('${formatCurrency(' + base + ')}') if is_template else ('{formatCurrency(' + base + ')}')
            out.append(replacement)
            changes.append((line_no, full_span, replacement))
        else:
            review.append((line_no, full_span, "₹ interpolation doesn't match a provably-safe pattern (has a fallback, custom options, or non-numeric expression) — left as-is"))
            out.append(full_span)
        i = close_idx + 1
    return ''.join(out)


def replace_inline_intl_currency_calls(content, changes):
    """Replace standalone `new Intl.NumberFormat(LOCALE, {style:'currency',
    currency:'INR',...}).format(EXPR)` calls that are NOT inside a named
    formatCurrency wrapper (those are handled separately) with
    `formatCurrency(EXPR)`."""
    out = []
    i = 0
    n = len(content)
    pat = re.compile(r"""new\s+Intl\.NumberFormat\(\s*['"]([\w-]+)['"]\s*,\s*""")
    while i < n:
        m = pat.search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        if is_commented_line(content, start) or m.group(1) not in CURRENCY_LOCALES_SAFE:
            out.append(content[i:m.end()])
            i = m.end()
            continue

        opts_open = content.find('{', m.end() - 1)
        if opts_open == -1:
            out.append(content[i:m.end()])
            i = m.end()
            continue
        opts_close = find_matching_brace(content, opts_open)
        if opts_close == -1 or not is_intl_currency_options(content[opts_open:opts_close + 1]):
            out.append(content[i:m.end()])
            i = m.end()
            continue

        rest = content[opts_close + 1:]
        fmt_match = re.match(r'\s*\)\s*\.format\(', rest)
        if not fmt_match:
            out.append(content[i:m.end()])
            i = m.end()
            continue
        fmt_open = opts_close + 1 + fmt_match.end() - 1
        fmt_close = find_matching_paren(content, fmt_open)
        if fmt_close == -1:
            out.append(content[i:m.end()])
            i = m.end()
            continue

        expr = content[fmt_open + 1:fmt_close]
        line_no = content.count('\n', 0, start) + 1
        out.append(content[i:start])
        replacement = f"formatCurrency({expr})"
        out.append(replacement)
        changes.append((line_no, content[start:fmt_close + 1], replacement))
        i = fmt_close + 1
    return ''.join(out)


def process_date_fns_format(content, changes, skipped):
    if not re.search(r"""import\s*\{\s*format\s*\}\s*from\s*['"]date-fns['"]""", content):
        return content

    out = []
    i = 0
    n = len(content)
    while i < n:
        m = re.compile(r'\bformat\(').search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        open_idx = m.end() - 1
        close_idx = find_matching_paren(content, open_idx)
        if close_idx == -1:
            out.append(content[i:])
            break
        out.append(content[i:start])
        args_str = content[open_idx + 1:close_idx]
        args = split_top_level_args(args_str)
        line_no = content.count('\n', 0, start) + 1

        replaced = False
        if is_commented_line(content, start):
            pass  # leave dead/commented-out code untouched
        elif len(args) == 2:
            fmt = extract_quoted(args[1])
            expr = args[0]
            if fmt in DATE_ONLY_SAFE:
                out.append(f"formatDate({expr})")
                changes.append((line_no, content[start:close_idx + 1], f"formatDate({expr})"))
                replaced = True
            elif fmt in DATETIME_SAFE:
                out.append(f"formatDateTime({expr})")
                changes.append((line_no, content[start:close_idx + 1], f"formatDateTime({expr})"))
                replaced = True
            elif fmt is not None:
                skipped.append((line_no, content[start:close_idx + 1], f"date-fns format string '{fmt}' not in safe list"))
        if not replaced:
            out.append(content[start:close_idx + 1])
        i = close_idx + 1
    return ''.join(out)


def process_moment_format(content, changes, skipped):
    """Handle moment(EXPR).format('FMT') calls."""
    if 'moment(' not in content:
        return content

    out = []
    i = 0
    n = len(content)
    while i < n:
        m = re.compile(r'\bmoment\(').search(content, i)
        if not m:
            out.append(content[i:])
            break
        start = m.start()
        open_idx = m.end() - 1
        close_idx = find_matching_paren(content, open_idx)
        if close_idx == -1:
            out.append(content[i:])
            break

        # is this immediately followed by .format(...)?
        rest = content[close_idx + 1:]
        fmt_call = re.match(r'\s*\.format\(', rest)
        if not fmt_call:
            out.append(content[i:close_idx + 1])
            i = close_idx + 1
            continue

        fmt_open = close_idx + 1 + fmt_call.end() - 1
        fmt_close = find_matching_paren(content, fmt_open)
        if fmt_close == -1:
            out.append(content[i:close_idx + 1])
            i = close_idx + 1
            continue

        expr = content[open_idx + 1:close_idx].strip()
        if expr == '':
            expr = 'new Date()'  # moment() with no args == "now"
        fmt_arg = content[fmt_open + 1:fmt_close].strip()
        fmt = extract_quoted(fmt_arg)
        line_no = content.count('\n', 0, start) + 1
        full_call = content[start:fmt_close + 1]

        out.append(content[i:start])
        replaced = False
        if is_commented_line(content, start):
            pass  # leave dead/commented-out code untouched
        elif fmt in DATE_ONLY_SAFE:
            out.append(f"formatDate({expr})")
            changes.append((line_no, full_call, f"formatDate({expr})"))
            replaced = True
        elif fmt in DATETIME_SAFE:
            out.append(f"formatDateTime({expr})")
            changes.append((line_no, full_call, f"formatDateTime({expr})"))
            replaced = True
        elif fmt is not None:
            skipped.append((line_no, full_call, f"moment format string '{fmt}' not in safe list"))

        if not replaced:
            out.append(full_call)
        i = fmt_close + 1
    return ''.join(out)


def ensure_import(content, needs_date, needs_datetime, needs_currency=False):
    names_needed = []
    if needs_date:
        names_needed.append('formatDate')
    if needs_datetime:
        names_needed.append('formatDateTime')
    if needs_currency:
        names_needed.append('formatCurrency')
    if not names_needed:
        return content

    existing_import_re = re.compile(
        r"""import\s*\{([^}]*)\}\s*from\s*['"]@/utilities/formatters['"];?"""
    )
    m = existing_import_re.search(content)
    if m:
        current_names = [x.strip() for x in m.group(1).split(',') if x.strip()]
        for nm in names_needed:
            if nm not in current_names:
                current_names.append(nm)
        new_import = "import { " + ", ".join(current_names) + " } from '@/utilities/formatters';"
        content = content[:m.start()] + new_import + content[m.end():]
        return content

    # No existing import from formatters -> insert after the LAST complete
    # top-of-file import statement (matched as a whole `import ... from '...';`
    # unit, so we never insert in the middle of a multi-line named-import list).
    import_stmt_re = re.compile(r"import\b[^;]*?from\s*['\"][^'\"]+['\"]\s*;", re.DOTALL)
    search_window = content[:4000]  # imports are always near the top
    last_end = 0
    for im in import_stmt_re.finditer(search_window):
        last_end = im.end()
    new_line = "import { " + ", ".join(names_needed) + " } from '@/utilities/formatters';\n"
    if last_end > 0:
        return content[:last_end] + "\n" + new_line.rstrip('\n') + content[last_end:]
    else:
        return new_line + content


def process_file(path):
    # newline='' preserves the file's original line endings (CRLF/LF) so the
    # diff only shows the actual code changes, not line-ending churn.
    with open(path, 'r', encoding='utf-8', errors='ignore', newline='') as f:
        original = f.read()

    changes, skipped = [], []
    stripped_wrappers, manual_review_wrappers = [], []
    currency_review = []

    # STEP 1: remove any local formatDate/formatDateTime wrapper that is a
    # provable re-implementation of the shared formatter -- MUST run before
    # step 2, otherwise step 2 can rewrite a call *inside* that wrapper's own
    # body into a call to itself (infinite recursion bug).
    content = strip_recursion_risk_wrappers(original, stripped_wrappers, manual_review_wrappers)

    # STEP 1b: same idea for currency -- strip local formatCurrency wrappers
    # (and any private formatAmount-style helper they alone depended on)
    # BEFORE rewriting call sites, to avoid the identical self-recursion trap.
    content, helper_candidates = strip_currency_wrapper_functions(content, stripped_wrappers, manual_review_wrappers)
    content = strip_unused_currency_helpers(content, helper_candidates, stripped_wrappers)

    # STEP 2: rewrite remaining display-date format(...)/moment(...).format(...)
    # call sites elsewhere in the file.
    content = process_date_fns_format(content, changes, skipped)
    content = process_moment_format(content, changes, skipped)

    # STEP 3: currency call-site rewrites --
    #   a) ₹{X.toFixed(2)} / ₹${X.toLocaleString('en-IN')} -> formatCurrency(X)
    #   b) standalone new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', ...}).format(X) -> formatCurrency(X)
    content = replace_rupee_interpolations(content, changes, currency_review)
    content = replace_inline_intl_currency_calls(content, changes)

    if changes or stripped_wrappers:
        needs_date = any('formatDate(' in c[2] and 'formatDateTime(' not in c[2] for c in changes) or \
            any(n == 'formatDate' for _, n in stripped_wrappers)
        needs_datetime = any('formatDateTime(' in c[2] for c in changes) or \
            any(n == 'formatDateTime' for _, n in stripped_wrappers)
        needs_currency = any('formatCurrency(' in c[2] for c in changes) or \
            any(n == 'formatCurrency' for _, n in stripped_wrappers)
        content = ensure_import(content, needs_date, needs_datetime, needs_currency)

    if content != original:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)

    return changes, skipped, stripped_wrappers, manual_review_wrappers, currency_review


def main(root):
    report = {"fixed": {}, "review_needed": {}, "wrappers_removed": {}, "wrappers_review_needed": {}, "currency_review_needed": {}}
    total_fixed = 0
    total_skipped = 0
    total_stripped = 0
    total_wrapper_review = 0
    total_currency_review = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_EXCLUDE_DIRS]
        for fn in filenames:
            if not (fn.endswith('.ts') or fn.endswith('.tsx')):
                continue
            fpath = os.path.join(dirpath, fn)
            rel = os.path.relpath(fpath, root)
            changes, skipped, stripped_wrappers, manual_review_wrappers, currency_review = process_file(fpath)
            if changes:
                report["fixed"][rel] = [{"line": l, "before": b, "after": a} for l, b, a in changes]
                total_fixed += len(changes)
            if skipped:
                report["review_needed"][rel] = [{"line": l, "code": c, "reason": r} for l, c, r in skipped]
                total_skipped += len(skipped)
            if stripped_wrappers:
                report["wrappers_removed"][rel] = [{"line": l, "name": n} for l, n in stripped_wrappers]
                total_stripped += len(stripped_wrappers)
            if manual_review_wrappers:
                report["wrappers_review_needed"][rel] = [{"line": l, "name": n, "reason": r} for l, n, r in manual_review_wrappers]
                total_wrapper_review += len(manual_review_wrappers)
            if currency_review:
                report["currency_review_needed"][rel] = [{"line": l, "code": c, "reason": r} for l, c, r in currency_review]
                total_currency_review += len(currency_review)

    print(f"Removed {total_stripped} self-recursion-risk local wrapper(s) across {len(report['wrappers_removed'])} file(s).")
    print(f"Auto-fixed {total_fixed} date/currency call(s) across {len(report['fixed'])} file(s).")
    print(f"Flagged {total_skipped} date call(s) across {len(report['review_needed'])} file(s) for manual review.")
    print(f"Flagged {total_wrapper_review} custom local formatDate/formatDateTime/formatCurrency wrapper(s) across {len(report['wrappers_review_needed'])} file(s) -- not auto-touched.")
    print(f"Flagged {total_currency_review} ₹ interpolation(s) across {len(report['currency_review_needed'])} file(s) for manual review.")
    with open(os.path.join(root, '..', 'codemod_report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    return report


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')