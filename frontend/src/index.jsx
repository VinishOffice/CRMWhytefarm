import ReactDOM from 'react-dom/client';
import Navigator from './Navigator';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalState from './context/GlobalState';

const globalStyles = `
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }
  .page_heading {
    font-size: 18px;
    color: #288a84;
    font-weight: 700;
    margin-top: 12px;
    text-align: center;
  }
  .filter_containers {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .custom_container {
    margin: 5px;
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
    margin-bottom: 200px;
  }
  .pagination_text {
    font-size: 14px;
    color: #288a84;
    font-weight: 700;
  }
  .Toastify__toast {
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
    background-color: #ffffff;
    color: #333333;
    font-family: Arial, sans-serif;
    font-size: 16px;
  }
  .Toastify__toast--success {
    border-left: 6px solid #4caf50;
  }
  .Toastify__toast--error {
    border-left: 6px solid #f44336;
  }
  .Toastify__toast--info {
    border-left: 6px solid #2196f3;
  }
  .Toastify__toast-body {
    padding: 16px;
  }
  .responsive-div {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
    background-color: #f0f0f0;
  }
  @media (max-width: 768px) {
    .responsive-div {
      max-width: 100%;
    }
  }
  /* Report.css */
  .report-viewer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .category-card {
    width: 300px;
    margin: 10px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
  }
  .category-title {
    margin-top: 0;
  }
  .report-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .report-card {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .report-card:hover {
    background-color: #f0f0f0;
  }
  .spinner-container {
    height: 15vh;
  }
  .spinner-overlay {
    position: absolute;
    margin-left: 43%;
    margin-top: 5%;
  }
  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  .spinnerLogin {
    position: absolute;
    top: 75%;
    left: 50%;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .export-excel-button {
    background-color: #007bff;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .export-excel-button:hover {
    background-color: #0056b3;
  }
  .low-cr-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .select-container {
    display: flex;
    align-items: center;
  }
  .select-container h4 {
    margin-right: 10px;
  }
  .export-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .export-button:hover {
    background-color: #0056b3;
  }
  .disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .custom-button-blue {
    color: #ffff;
    font-size: 14px !important;
    font-weight: 500;
    background: #4a54ba;
  }
  /* OrderSheet.css */
  .panel-search {
    display: flex;
    align-items: center;
    margin-left: 10px;
  }
  .panel-body {
    overflow: auto;
  }
  .datepicker-container {
    margin-right: 20px;
    margin-left: 5px;
  }
  .dropdown-container {
    margin-right: 20px;
  }
  .dropdown-container label {
    margin-right: 2px;
  }
  .inputPanels {
    margin-left: 20px;
  }
  .inputPanels label {
    margin-bottom: 10px;
  }
  .inputPanels select {
    display: block;
  }
  footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  footer h4 {
    position: relative;
    display: inline;
  }
  .grid-container {
    display: grid;
    grid-template-columns: 30% 70%;
    gap: 1px;
  }
  .parent-panel {
    border: 1px solid #000;
  }
  .panel1 {
    background-color: #ccc;
  }
  .panel2 {
    background-color: #eee;
    border-radius: 10px;
  }
  /* OnBoardCustomer.css */
  .datepickers-container {
    display: flex;
    align-items: center;
  }
  .datepicker-label {
    margin-right: 10px;
  }
  .datepicker-input {
    border-radius: 5px;
    padding: 8px;
    border: 1px solid #ced4da;
  }
  .datepicker-input:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  .invalid .datepicker-input {
    border: 1px solid red;
  }
  .dashboard-stat-card {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100px;
  }
  .dashboard-stat-card:hover {
    background-color: #e6ffe6;
  }
  .dashboard-stat-card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0;
  }
  .dashboard-stat-card-value {
    font-size: 2.5rem;
    font-weight: bold;
    text-align: right;
  }
  .dot-typing::after {
    font-size: 2.5rem;
    font-weight: bold;
    text-align: right;
    content: '.';
    animation: dots 1.2s steps(3, end) infinite;
  }
  @keyframes dots {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
    100% { content: '.'; }
  }
  .modal-5xl {
    max-width: 90vw !important;
  }
`;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <style>{globalStyles}</style>
    <GlobalState>
      <Navigator />
    </GlobalState>
    <ToastContainer autoClose={2000} />
  </>
);
