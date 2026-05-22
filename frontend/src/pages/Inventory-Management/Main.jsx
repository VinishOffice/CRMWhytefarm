import { useNavigate } from "react-router-dom";
import React, { useState, useEffect,useContext } from "react";
import TopPanel from "../../TopPanel";
import Sidebar from "../../Sidebar";
import Footer from "../../Footer";
import Swal from 'sweetalert2'
import GlobalContext from "../../context/GlobalContext";
import Inventory_Home from "./Inventory_Home";
import { InventoryProvider } from "./InventoryContext";


const Inventory_Main = ({value})=>{
        const {permissible_roles} = useContext(GlobalContext);
        const navigate = useNavigate();
      
        useEffect(() => {
          const loggedIn = localStorage.getItem("loggedIn") === "true";
          if (!loggedIn) {
              navigate("/login");
          }
      }, [navigate,permissible_roles]);
        const Toast = Swal.mixin({
          toast: true,
          background: '#69aba6',
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer);
              toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });
        const [loading, setLoading] = useState(false);  
      
        const notAuthorized = () => {
          const Toast = Swal.mixin({
              toast: true,
              background: '#d7e7e6',
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer);
                  toast.addEventListener('mouseleave', Swal.resumeTimer);
              }
          });
      
          Toast.fire({
              icon: 'error',
              title: 'You are not authorised to do this action'
          });
      }
      
        return (
          <>
            <div class="container-scroller">
              <TopPanel />
              <div class="container-fluid page-body-wrapper">
                <Sidebar />
                <div class="main-panel"> 
            {loading && (
              <div className="loader-overlay">
                <div className="">
                  <img
                    alt="loader"
                    style={{
                      height: "6rem",
                    }}
                    src="images/loader.gif"
                  ></img>
                </div>
              </div>
            )}
                  <div class="content-wrapper"> 
                    <InventoryProvider>
                      <Inventory_Home setLoading={setLoading}/>
                    </InventoryProvider>
                  <Footer />
                </div>
                </div>
              </div>
            </div>
          </>
        );
      }
export default Inventory_Main