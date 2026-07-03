// utils/confirmDelete.ts

export const confirmDelete = (itemType: string): boolean => {
    if (typeof window === "undefined") return false;
  
    const userInput = prompt(`Are you sure you want to delete this ${itemType}?\nType 'Delete' to confirm:`);
  
    if (userInput !== "Delete") {
      alert("Confirmation failed! Action canceled.");
      return false;
    }
  
    return true;
  };