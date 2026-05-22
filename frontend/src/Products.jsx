import React, { useState, useEffect,useContext } from "react";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import { useCookies } from "react-cookie";
import Swal from 'sweetalert2';
import { useNavigate, Link, useParams } from 'react-router-dom';
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import apiClient from "./services/apiClient";
function Products() {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('products')){
              handleLogout()
              navigate("/permission_denied");
          }
      }
  }
  }, [navigate,permissible_roles]);
  const [cookies] = useCookies(["permissions"]);
  const rolePermissions = cookies.permissions ? cookies.permissions.Products || [] : [];
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const initialProductState = {
    productId: "",
    productName: "",
    productDescription: "",
    image: "",
    category: "",
    brand: "",
    gst: "",
    inStock: true,
    enableLogistic: false,
    publishOnApp: true,
    publishOnB2B: true,
    launchDate: new Date(),
    updated_date: new Date(),
    created_date: new Date(),
    packagingOptions: [{ packaging: "", pkgUnit: "", price: "" }],
  };

  const addNewProduct = () => {
    setEditProduct(false);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  function generateUniqueId() {
    const now = new Date();
    const timestamp = now.getTime();
    const random4Digits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const customerId =
      (timestamp % 10000).toString().padStart(4, "0") + random4Digits;

    return customerId;
  }

  const handleSaveChanges = async (productDetails) => {

    try {
      if (!editProduct) {
        const newProduct = { ...productDetails, productId: generateUniqueId() };
        await apiClient.post("/api/products_data", newProduct);

        toast.success("Product added successfully");

      }

      handleCloseModal();
    } catch (error) {
      toast.error("Product not added successfully");
      console.error("Error updating document: ", error);
    }
  };

  const rolePermission = () => {
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
      {loading && (
        <div className="loader-overlay">
          <div className="">
            <img
              style={{
                height: "6rem",
              }}
              alt="loader"
              src="images/loader.gif"
            ></img>
          </div>
        </div>
      )}
      <div class="container-scroller">
        <TopPanel />
        <div class="container-fluid page-body-wrapper">
          <Sidebar />
          <div class="main-panel">
            <div class="content-wrapper">
              <div class="col-lg-12 grid-margin stretch-card">
                <div class="card" style={{ background: '#4a54ba' }}>
                  <div class="card-body">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h4 class="card-title" style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>Products</h4>
                      <p class="card-description">
                        {permissible_roles.includes('create_product') ? <> <button
                          type="button"
                          class="btn btn-success btn-rounded btn-sm"
                          data-toggle="modal"
                          data-target="#exampleModal-2"
                          onClick={addNewProduct}
                        >
                          Add Product
                        </button> </> : <>
                          <button
                            type="button"
                            class="btn btn-success btn-rounded btn-sm"
                            data-toggle="modal"
                            data-target="#exampleModal-2"
                            onClick={() => rolePermission()}
                          >
                            Add Product
                          </button></>}
                      </p>
                    </div>

                    <ProductList />

                    {showAddModal && (
                      <ProductModal
                        show={showAddModal}
                        handleClose={handleCloseModal}
                        initialData={initialProductState}
                        updateData={handleSaveChanges}
                        editProduct={editProduct}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Products;
