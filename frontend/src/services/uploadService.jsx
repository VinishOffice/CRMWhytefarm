import apiClient from "./apiClient";

export const uploadFile = async (file, path) => {
  const form = new FormData();
  form.append("file", file);
  if (path) form.append("path", path);

  const res = await apiClient.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// Compatibility helpers for existing upload flows
export const storage = {};
export const ref = (_storage, path) => ({ path });

export const uploadBytesResumable = (storageRef, file) => {
  const task = {
    snapshot: { ref: storageRef },
    on: async (_event, _progressCb, errorCb, completeCb) => {
      try {
        const res = await uploadFile(file, storageRef.path);
        task.snapshot.ref = { ...storageRef, url: res.url };
        if (typeof completeCb === "function") completeCb();
      } catch (err) {
        if (typeof errorCb === "function") errorCb(err);
      }
    },
  };
  return task;
};

export const uploadBytes = async (storageRef, file) => {
  const res = await uploadFile(file, storageRef.path);
  return { ref: { ...storageRef, url: res.url } };
};

export const getDownloadURL = async (storageRef) => storageRef.url || "";
