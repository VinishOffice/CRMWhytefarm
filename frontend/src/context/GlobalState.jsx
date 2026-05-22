
import GlobalContext from "./GlobalContext";
import { getUserInfo } from '../Utility';
import { useEffect,useState } from 'react';
import apiClient from '../services/apiClient';
const GlobalState = ({children}) =>{
    const [permissible_roles, setPermissibleRoles] = useState([]);
    const { loggedIn, userId, username, loggedIn_user,role,hub_name } = getUserInfo();
    const [state_user,setStateUser] = useState({
        "loggedIn":loggedIn,
        "userId":userId,
        "username":username,
        "loggedIn_user":loggedIn_user,
        "role":role,
        "hub_name":hub_name
    })

    useEffect(() => {
        if (!role) {
            return;
        }
        const fetchPermissions = async () => {
            try {
                const response = await apiClient.get(`/api/user_permissions/${role}`);
                const data = response.data?.data || response.data; // Handle wrapped or unwrapped
                if (data && data.permission && Array.isArray(data.permission)) {
                    setPermissibleRoles(data.permission);
                } else {
                    console.error("Invalid permission data structure:", data);
                    setPermissibleRoles([]);
                }
            } catch (error) {
                console.error("Error fetching permissions:", error);
                setPermissibleRoles([]);
            }
        };

        fetchPermissions();
    }, [state_user]);
    
    return (
        <GlobalContext.Provider value={{
            "permissible_roles":permissible_roles,
            "state_user":state_user,
            "setStateUser":setStateUser

        }}>
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalState;