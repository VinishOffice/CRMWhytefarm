import  { useEffect } from 'react';
import Swal from 'sweetalert2';

const ShowNotification = ({ title, text, icon, showConfirmButton = true, timer = null }) => {
  useEffect(() => {
    Swal.fire({
      title,
      text,
      icon,
      showConfirmButton,
      timer,
    });
  }, [title, text, icon, showConfirmButton, timer]);

  return null;
};

export default ShowNotification;