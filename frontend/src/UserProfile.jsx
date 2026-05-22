import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "./Sidebar";
import Swal from 'sweetalert2';
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import { getUserInfo } from "./Utility";
import { useCookies } from "react-cookie";
import {ref, getDownloadURL, uploadBytesResumable, storage} from './services/uploadService';
import apiClient from './services/apiClient';

function UserProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const userDocIdRef = useRef(""); // Holds user document ID
  const { loggedIn, userId, loggedIn_user } = getUserInfo();
  const [cookies, setCookie] = useCookies(["permissions"]);

  const initialFormData = {
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    username: "",
    password: "",
    phone_no: "",
    status: true,
    user_image: null,
    created_date: new Date(),
    updated_date: new Date(),
  };

  const [formData, setFormData] = useState(initialFormData);
  const [uploadFile, setUploadFile] = useState(null); // for image upload only

  useEffect(() => {
    if (!loggedIn) navigate("/login");

    const fetchUserData = async () => {
      try {
        const res = await apiClient.post("/api/users/query", {
          filters: [{ field: "user_id", op: "==", value: userId }],
          limit: 1
        });
        const docs = res.data?.data || [];
        if (docs.length > 0) {
          const doc = docs[0];
          userDocIdRef.current = doc._id;
          const userData = doc;

          if (!userData.user_image && cookies?.permissions?.loggedIn_user?.profileImage) {
            userData.user_image = cookies.permissions.loggedIn_user.profileImage;
          }

          setFormData(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [navigate, loggedIn, userId, cookies]);


  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setUploadFile(files[0]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let updatedData = { ...formData };

      // Upload image if selected
      if (uploadFile) {
        const storageRef = ref(storage, `users/${uploadFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, uploadFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              updatedData.user_image = downloadURL;

              // update cookie profile image
              setCookie(
                "permissions",
                {
                  ...(cookies.permissions || {}),
                  loggedIn_user: {
                    ...(cookies.permissions?.loggedIn_user || {}),
                    profileImage: downloadURL,
                  }
                },
                { path: "/" }
              );

            });

        });
      }

      await apiClient.patch(`/api/users/${userDocIdRef.current}`, updatedData);

      Swal.fire({
        toast: true,
        icon: "success",
        title: "User Profile Updated Successfully",
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });

      fileInputRef.current.value = "";
      setUploadFile(null);
    } catch (error) {
      console.error("Error updating user data:", error);
      Swal.fire({
        toast: true,
        icon: "error",
        title: "User Profile Update Failed",
        background: "#f87171",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  return (
    <div className="container-scroller">
      <TopPanel />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-4 text-center pb-4">
                        <img
                          alt="profile"
                          src={formData.user_image || cookies?.permissions?.loggedIn_user?.profileImage || 'https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg'}
                          className="img-lg rounded-circle mb-3"
                          style={{ width: "120px", height: "120px", marginTop: "3rem" }}
                        />

                        <h3>{formData.first_name} {formData.last_name}</h3>
                        <p className="w-75 mx-auto mb-3" style={{ fontSize: 14 }}>User Role : {formData.role}</p>
                      </div>

                      <div className="col-lg-8">
                        <form onSubmit={handleSubmit}>
                          <div className="form-group row">
                            <div className="col">
                              <label>Update Profile Image:</label>
                              <input
                                className="form-control"
                                type="file"
                                name="user_image"
                                ref={fileInputRef}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col">
                              <label>User Name:</label>
                              <input className="form-control" type="text" value={formData.username} disabled />
                            </div>
                          </div>

                          <div className="form-group row">
                            <div className="col">
                              <label>First Name:</label>
                              <input className="form-control" type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </div>
                            <div className="col">
                              <label>Last Name:</label>
                              <input className="form-control" type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                            </div>
                          </div>

                          <div className="form-group row">
                            <div className="col">
                              <label>Email ID:</label>
                              <input className="form-control" type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="col">
                              <label>Mobile No:</label>
                              <input className="form-control" type="text" name="phone_no" value={formData.phone_no} onChange={handleChange} required />
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "end" }}>
                            <button type="submit" className="btn btn-success btn-sm">Update Profile</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
