import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../../Utility";
import { useInventoryContext } from "./InventoryContext";
import apiClient from "../../services/apiClient";

const useFetchUserRole = () => {
    const navigate = useNavigate();
    const {setUser} = useInventoryContext();
    useEffect(() => {
      const fetchUserRole = async () => {
        try {
          const userId = localStorage.getItem("userId");
  
          if (!userId) {
            handleLogout();
            navigate("/permission_denied");
            return;
          }
  
          const docs = await apiClient.post("/api/users/query", {
            filters: [{ field: "user_id", op: "==", value: userId }]
          }).then(res => res.data?.data || []);
  
          if (docs.length > 0) {
            const user = docs[0];
            localStorage.setItem("role", user.role);
            if(user.role === "Hub Manager"){
                localStorage.setItem("hub_name", user.hub_name);
            }
            setUser(user);
            
          } else {
            handleLogout();
            navigate("/permission_denied");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          handleLogout();
          navigate("/permission_denied");
        }
      };
  
      fetchUserRole();
    }, [navigate]);
  };
  
  export default useFetchUserRole;