export  function formatDate(timestamp, format = 'dd/mm/yyyy') {
    if (!timestamp) return '';
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.error('Invalid date');
      return '';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch(format) {
      case 'dd/mm/yyyy':
        return `${day}/${month}/${year}`;
      case 'mm/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }


  