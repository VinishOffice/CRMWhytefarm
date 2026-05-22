import React, { useState, useEffect, useContext } from "react";
import {ref, uploadBytes, getDownloadURL} from './services/uploadService';
import apiClient from './services/apiClient';
import {storage} from './services/uploadService';
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import { useNavigate } from "react-router-dom";

import toast, { Toaster } from "react-hot-toast";

const B2bBanner = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editImageId, setEditImageId] = useState("");

  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    if (permissible_roles.length > 0 && !permissible_roles.includes("b2b_banner")) {
      handleLogout();
      navigate("/permission_denied");
    }
  }, [navigate, permissible_roles]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const docs = await apiClient.post("/api/b2b_banners/query", { filters: [] })
        .then(res => res.data?.data || []);
      setImages(docs.map(doc => ({
        id: doc._id || doc.id,
        ...doc,
      })));
    } catch (error) {
      toast.error(`Error fetching images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Check for image file types
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      
      if (validImageTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        toast.error("Please select a valid image file (JPG, PNG, GIF, WEBP).");
        setFile(null);
      }
    } else {
      setFile(null);
    }
  };
  

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (images.length >= 1 && !editMode) {
      toast.error("Only one banner image can be uploaded. Please update the existing banner.");
      return;
    }

    const uniqueImageName = `${file.name}_${Date.now()}`;
    const storageRef = ref(storage, `b2b_banners/${uniqueImageName}`);
    setIsUploading(true);

    try {
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      if (editMode) {
        await apiClient.put(`/api/b2b_banners/${editImageId}`, {
          name: uniqueImageName,
          url: downloadURL,
          updated_at: new Date(),
        });
        toast.success("Banner updated successfully!");
      } else {
        await apiClient.post("/api/b2b_banners", {
          name: uniqueImageName,
          url: downloadURL,
          created_at: new Date(),
        });
        toast.success("Banner uploaded successfully!");
      }

      fetchImages();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setFile(null);
      setShowModal(false);
    }
  };

  const handleEdit = (imageId) => {
    setEditMode(true);
    setEditImageId(imageId);
    setShowModal(true);
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {loading && (
        <div className="loader-overlay">
          <div>
            <img alt="loader" style={{ height: "6rem" }} src="images/loader.gif" />
          </div>
        </div>
      )}
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <h4 className="card-title">B2B Banners</h4>
                      <button
                        type="button"
                        className="btn btn-success btn-rounded btn-sm mb-2"
                        onClick={() => {
                          setEditMode(false);
                          setShowModal(true);
                        }}
                      >
                        Upload Image
                      </button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th className="text-center">Sr. No</th>
                            <th className="text-center">Image</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {images.map((image, index) => (
                            <tr key={image.id}>
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">
                                <img src={image.url} alt={image.name} style={{ width: "100px", height: "50px" }} />
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-dark btn-sm"
                                  onClick={() => handleEdit(image.id)}
                                >
                                  <i className="mdi mdi-pencil" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog modal-md">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">{editMode ? "Edit Image" : "Upload Image"}</h5>
                        <button
                          type="button"
                          className="close"
                          onClick={() => setShowModal(false)}
                        >
                          &times;
                        </button>
                      </div>
                      <div className="modal-body">
                        <input type="file" onChange={handleFileChange} />
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowModal(false)}
                        >
                          Close
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? "Uploading..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default B2bBanner;
