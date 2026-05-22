import React, { useState, useEffect, useContext } from 'react';
import ProductModal from './ProductModal';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {  Card, Row, Col, Form } from 'react-bootstrap';
import { useCookies } from "react-cookie";
import { useNavigate} from 'react-router-dom';
import GlobalContext from "./context/GlobalContext";
import apiClient from "./services/apiClient";
import { normalizeDateValue } from "./helpers";

const productListStyles = `
  tr {
    transition: opacity 0.5s ease-in-out;
  }
  .fade-out {
    opacity: 0.7;
  }
  .fade-in {
    opacity: 1;
  }
  .fade-crm {
    opacity: 0.7;
    background-color: #84bf93;
  }
`;

function ProductList() {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (loggedIn) {
      // navigate("/");
    } else {
      navigate("/login");
    }
  }, [navigate,permissible_roles]);

const [cookies] = useCookies(["permissions"]);
const rolePermissions = cookies.permissions ? cookies.permissions.Products || [] : [];
const [products, setProducts] = useState([]);

  const [selectedRow, setSelectedRow] = useState({});
  const [editProduct, setEditProduct] = useState(false);

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    let isMounted = true;
    apiClient.post("/api/products_data/query", { filters: [] }).then(res => {
      if(isMounted) {
        const productsData = (res.data?.data || []).map(doc => ({ id: doc._id, ...doc }));
        setProducts(productsData);
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, []);

  const handleToggle = async (productId) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(product => {
        if (product.id === productId) {
          return { ...product, inStock: !product.inStock , publishOnCRM : product.inStock };
        }
        return product;
      });
      // Update backend via API
      apiClient.patch(`/api/products_data/${productId}`, {
        inStock: !prevProducts.find(product => product.id === productId).inStock,
        publishOnCRM: prevProducts.find(product => product.id === productId).inStock
      });

      return updatedProducts;
    });
  };

  const handleEdit = (product) => {

    setSelectedRow(product);
    if (product.launchDate) {
      const date = normalizeDateValue(product.launchDate);
      setSelectedRow({ ...product, launchDate: date });
    }
    setShowModal(true);
    setEditProduct(true);

  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRow(null);
  };


  const handleSaveChanges = async (productDetails) => {
    
    
    try {
      if (editProduct) {
        
        await apiClient.patch(`/api/products_data/${selectedRow.id}`, productDetails);
        const updatedProducts = products.map(product =>
          product.id === selectedRow.id ? { ...product, ...productDetails } : product
        );
        toast.info("Product updated successfully");
        setProducts(updatedProducts);
      }
      handleCloseModal();
    } catch (error) {
      toast.error("Product not updated successfully");
      console.error('Error updating document: ', error);
    }
  };

  const confirmDelete = async (productId) => {

    try {
      await apiClient.post("/api/products_data/query", {
        filters: [{ field: "productId", op: "==", value: productId }]
      }).then(res => {
        const docs = res.data?.data || [];
        if (docs.length > 0) {
          apiClient.delete(`/api/products_data/${docs[0]._id}`).then(() => {
            //toast.error("Product Deleted Successfully");
          });
        }
      });
      toast.error("Product Deleted Successfully");
      setProducts(products.filter(product => product.productId !== productId));
    } catch (error) {
      toast.error("Product not Deleted Successfully");
      console.error('Error deleting document: ', error);
    }
  };

  const handleDelete = (productId) => {

    if (productId === '') {
      toast.error("There is some error. Deleted Unsuccessful.");
    } else {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        className: "p-5"
      }).then((result) => {
        if (result.isConfirmed) {
          confirmDelete(productId);

        }
      });
    }

  };

  const [selectedPackaging, setSelectedPackaging] = useState(null);

  const handlePackagingClick = (packaging) => {
    setSelectedPackaging(packaging);
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
      <style>{productListStyles}</style>
      {showModal && (
        <ProductModal
          show={showModal}
          handleClose={handleCloseModal}
          initialData={selectedRow}
          updateData={handleSaveChanges}
          editProduct={editProduct}
        />
      )}

      {products.map((product, index) => (
        <Card
          className={` mb-3 ${
            product.publishOnCRM
              ? "fade-crm"
              : product.inStock
              ? "fade-in"
              : "fade-out"
          }`}
        >
          <Row>
            <Col md={2}>
              <Card.Img variant="top" src={product.image} />
            </Col>
            <Col md={5}>
              <Card.Body>
                <Card.Title>{product.productName}</Card.Title>
                <Card.Text
                  dangerouslySetInnerHTML={{
                    __html: product.productDescription,
                  }}
                ></Card.Text>
                <Card.Text>
                  <Form.Switch
                    checked={product.inStock}
                    onChange={() => handleToggle(product.id)}
                  />
                </Card.Text>
              </Card.Body>
            </Col>
            <Col md={2}>
              <Card.Text style={{ paddingTop: "10px" }}>
                <span>Packaging :</span>
              </Card.Text>
              <Card.Text>
                <span>Price :</span>
              </Card.Text>
              <Card.Text>
                <span>GST :</span>
              </Card.Text>
              <Card.Text style={{ paddingTop: "5px" }}>
                {permissible_roles.includes("edit_product") ? (
                  <>
                    <button
                      style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                      class=" btn btn-dark btn-sm"
                      onClick={() => handleEdit(product)}
                    >
                      <i
                        class="menu-icon mdi mdi-pencil"
                        style={{ color: "white" }}
                      ></i>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                      class=" btn btn-dark btn-sm"
                      onClick={() => rolePermission()}
                    >
                      <i
                        class="menu-icon mdi mdi-pencil"
                        style={{ color: "white" }}
                      ></i>
                    </button>
                  </>
                )}

                {permissible_roles.includes("delete_product") ? (
                  <>
                    <button
                      style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                      class="btn btn-dark btn-sm"
                      onClick={() => handleDelete(product.productId)}
                    >
                      <i
                        class="menu-icon mdi mdi-delete"
                        style={{ color: "white" }}
                      ></i>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                      class="btn btn-dark btn-sm"
                      onClick={() => rolePermission()}
                    >
                      <i
                        class="menu-icon mdi mdi-delete"
                        style={{ color: "white" }}
                      ></i>
                    </button>
                  </>
                )}
              </Card.Text>
            </Col>
            <Col md={3}>
              <Card.Text style={{ paddingTop: "10px" }}>
                {product.packagingOptions.map((option, i) => (
                  <>
                    <button
                      type="button"
                      class="btn btn-success btn-rounded btn-sm"
                      style={{ color: "white" }}
                      onClick={() => handlePackagingClick(option.packaging)}
                      variant={
                        selectedPackaging === option.packaging
                          ? "primary"
                          : "outline-primary"
                      }
                    >
                      {option.packaging + " " + option.pkgUnit}
                    </button>{" "}
                    {"  "}
                  </>
                ))}
              </Card.Text>
              <Card.Text>
                {selectedPackaging &&
                product.packagingOptions.find(
                  (option) => option.packaging === selectedPackaging
                )
                  ? product.packagingOptions.find(
                      (option) => option.packaging === selectedPackaging
                    ).price
                  : product.packagingOptions[0].price}
              </Card.Text>
              <Card.Text>{product.gst ? product.gst + " %" : "0 %"}</Card.Text>
            </Col>
          </Row>
        </Card>
      ))}
    </>
  );
}

export default ProductList
