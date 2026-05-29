import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const usePermissions = () => {
  const authState = useSelector((state: RootState) => state.auth);
  
 

  const getPermissions = () => {
    // Get from Redux auth state first
    let permissions = authState.permissions;
    
  
    
    // If empty, check localStorage as fallback
    if (!permissions || Object.keys(permissions).length === 0) {
      try {
        const storedPermissions = localStorage.getItem('userPermissions');
        if (storedPermissions) {
         
          return JSON.parse(storedPermissions);
        }
      } catch (error) {
       
      }
    }
    
    // Return whatever we have (could be empty)
    return permissions || {};
  };

  const permissions = getPermissions();

  const hasPermission = (app: string, module: string, action: string): boolean => {
    try {
     
      
      if (!permissions || Object.keys(permissions).length === 0) {
       
        return false;
      }
      
      const appPerms = permissions[app] || {};
      const modulePerms = appPerms[module] || {};
      
      const hasPerm = modulePerms[action] === true || modulePerms[action] === 1;
     
      return hasPerm;
    } catch (error) {
      return false;
    }
  };

  const isModuleVisible = (app: string, module: string): boolean => {
    try {
      if (!permissions || Object.keys(permissions).length === 0) return false;
      
      const appPerms = permissions[app] || {};
      const modulePerms = appPerms[module] || {};
      
      const isVisible = !modulePerms.hide && 
                       (modulePerms.read === true || modulePerms.read === 1);
      
      return isVisible;
    } catch (error) {
      console.error('❌ Module visibility check error:', error);
      return false;
    }
  };

  return {
    hasPermission,
    isModuleVisible,
    permissions
  };
};

