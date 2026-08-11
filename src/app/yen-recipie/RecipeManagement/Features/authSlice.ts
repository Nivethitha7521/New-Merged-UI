
// // src/features/authSlice.ts
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// export interface AuthState {
//   isLoggedIn: boolean;
//   username: string | null;
//   token: string | null;
//   loginType: "normal" | "warehouse" | null;
//   error: string | null;
// }

// const initialState: AuthState = {
//   isLoggedIn: false,
//   username: null,
//   token: null,
//   loginType: null,
//   error: null,
// };

// export const login = createAsyncThunk(
//   "auth/login",
//   async (
//     {
//       username,
//       password,
//       loginType,
//     }: { username: string; password: string; loginType: "normal" | "warehouse" },
//     { rejectWithValue }
//   ) => {
//     try {
//       let response;

//       if (loginType === "warehouse") {
//         // Branch/Warehouse login → form-urlencoded + different endpoint
//         response = await axios.post(
//           "http://yenerp.com/birthdaycakeapi/warehouse/auth/token",
//           new URLSearchParams({ username, password }),
//           {
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//           }
//         );
//       } else {
//         // Normal (all-over) login → JSON payload
//         response = await axios.post(
//           "https://yenerp.com/recipeapi/login/",
//           { username, password },
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       const { access_token } = response.data;

//       return {
//         token: access_token,
//         username,
//         loginType,
//       };
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error)) {
//         const msg =
//           error.response?.data?.detail ||
//           error.response?.data?.non_field_errors?.[0] ||
//           "Invalid credentials. Please try again.";

//         return rejectWithValue(msg);
//       }

//       return rejectWithValue("Something went wrong. Please try again.");
//     }
//   }
// );

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     logout: (state) => {
//       state.isLoggedIn = false;
//       state.username = null;
//       state.token = null;
//       state.loginType = null;
//       localStorage.removeItem("token");
//       localStorage.removeItem("username");
//       localStorage.removeItem("isLoggedIn");
//       localStorage.removeItem("loginType");
//     },
//     restoreAuth: (state) => {
//       const token = localStorage.getItem("token");
//       const username = localStorage.getItem("username");
//       const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
//       const loginType = localStorage.getItem("loginType") as "normal" | "warehouse" | null;

//       if (token && isLoggedIn) {
//         state.isLoggedIn = true;
//         state.token = token;
//         state.username = username || "User";
//         state.loginType = loginType;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(login.fulfilled, (state, action) => {
//         state.isLoggedIn = true;
//         state.token = action.payload.token;
//         state.username = action.payload.username;
//         state.loginType = action.payload.loginType;
//         state.error = null;

//         // Persist everything
//         localStorage.setItem("token", action.payload.token);
//         localStorage.setItem("username", action.payload.username);
//         localStorage.setItem("isLoggedIn", "true");
//         localStorage.setItem("loginType", action.payload.loginType);
//       })
//       .addCase(login.rejected, (state, action) => {
//         state.error = action.payload as string;
//         state.isLoggedIn = false;
//         state.token = null;
//         state.username = null;
//         state.loginType = null;
//       });
//   },
// });

// export const { logout, restoreAuth } = authSlice.actions;
// export default authSlice.reducer;




















// src/features/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  token: string | null;
  loginType: "normal" | "warehouse" | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  username: null,
  token: null,
  loginType: null,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    {
      username,
      password,
      loginType,
    }: { username: string; password: string; loginType: "normal" | "warehouse" },
    { rejectWithValue }
  ) => {
    try {
      let response;

      if (loginType === "warehouse") {
        response = await axios.post(
          "http://yenerp.com/birthdaycakeapi/warehouse/auth/token",
          new URLSearchParams({ username, password }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
      } else {
        response = await axios.post(
          "https://yenerp.com/recipeapi/login/",
          { username, password },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const { access_token } = response.data;

      return {
        token: access_token,
        username,
        loginType,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          "Invalid credentials. Please try again.";

        return rejectWithValue(msg);
      }

      return rejectWithValue("Something went wrong. Please try again.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isLoggedIn = false;
      state.username = null;
      state.token = null;
      state.loginType = null;
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("loginType");

      // NEW: clear the cookie middleware.ts checks
      document.cookie = "token=; path=/; max-age=0";
    },
    restoreAuth: (state) => {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const loginType = localStorage.getItem("loginType") as "normal" | "warehouse" | null;

      if (token && isLoggedIn) {
        state.isLoggedIn = true;
        state.token = token;
        state.username = username || "User";
        state.loginType = loginType;

        // NEW: keep cookie in sync so middleware sees it even after a refresh
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}`;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.token = action.payload.token;
        state.username = action.payload.username;
        state.loginType = action.payload.loginType;
        state.error = null;

        // Persist everything (unchanged)
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("username", action.payload.username);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loginType", action.payload.loginType);

        // NEW: also set a cookie so middleware.ts (server-side) can see the session
        document.cookie = `token=${action.payload.token}; path=/; max-age=${60 * 60 * 24}`;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoggedIn = false;
        state.token = null;
        state.username = null;
        state.loginType = null;
      });
  },
});

export const { logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;