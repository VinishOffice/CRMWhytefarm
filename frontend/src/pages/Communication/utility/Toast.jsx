import Swal from "sweetalert2";
const Toast = Swal.mixin({
    toast: true,
    background: "#69aba6",
    position: "center",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

export function showCampaignError(errorMessage) {
    Toast.fire({
        title: "Campaign Launch Error",
        html: `
            <div style="display: flex; align-items: center; max-width: 400px; padding: 20px; border: 1px solid #f5c6cb; border-radius: 5px; background-color: #f8d7da; color: #721c24; font-family: Arial, sans-serif;">
                <div style="margin-right: 15px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; color: #721c24;"></i>
                </div>
                <div>
                    <p style="font-size: 16px; margin: 0;">${errorMessage}</p>
                </div>
            </div>
        `,
        confirmButtonText: "Got it",
        timer: 2000
    });
}

  export const notAuthorized = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };

export const cantCreateNewCampaign = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "New Campaign is already open",
    });
  };