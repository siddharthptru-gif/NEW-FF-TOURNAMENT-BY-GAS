const IMGBB_API_KEY = "a482dd7b880c7b2f57547c9fdf164d21";

export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error.message || 'Image upload failed');
  }
};
