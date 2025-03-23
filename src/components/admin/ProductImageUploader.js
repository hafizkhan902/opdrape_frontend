const handleUpload = async () => {
  if (!files.length) return;
  
  setLoading(true);
  setUploadProgress(0);
  setUploadStatus(null);
  
  try {
    let response;
    
    if (multiple) {
      console.log(`Uploading ${files.length} files to ${uploadType} endpoint...`);
      response = await uploadMultipleImages(files, uploadType);
      console.log('Multiple upload response:', response);
      
      // Handle various possible response formats
      let uploadedUrls = [];
      let uploadedFiles = [];
      
      if (response.data) {
        if (response.data.files && Array.isArray(response.data.files)) {
          // Standard format with files array
          uploadedFiles = response.data.files;
          uploadedUrls = response.data.files.map(file => file.url || file.path || file.location || '');
        } else if (response.data.urls && Array.isArray(response.data.urls)) {
          // Format with just urls array
          uploadedUrls = response.data.urls;
          uploadedFiles = uploadedUrls.map(url => ({ url }));
        } else if (Array.isArray(response.data)) {
          // Direct array in data
          uploadedFiles = response.data;
          uploadedUrls = response.data.map(item => 
            typeof item === 'string' ? item : (item.url || item.path || item.location || '')
          );
        } else if (response.data.url || response.data.path || response.data.location) {
          // Single file response
          const url = response.data.url || response.data.path || response.data.location;
          uploadedUrls = [url];
          uploadedFiles = [response.data];
        } else {
          // Try to extract URLs from any property that could be an array
          const possibleArrayProps = Object.entries(response.data)
            .filter(([_, value]) => Array.isArray(value))
            .sort(([_, a], [_, b]) => b.length - a.length); // Sort by array length
          
          if (possibleArrayProps.length > 0) {
            const [propName, array] = possibleArrayProps[0];
            console.log(`Found array in response.data.${propName} with ${array.length} items`);
            
            if (array.length > 0) {
              if (typeof array[0] === 'string') {
                // Array of strings
                uploadedUrls = array;
                uploadedFiles = array.map(url => ({ url }));
              } else if (typeof array[0] === 'object') {
                // Array of objects
                uploadedFiles = array;
                uploadedUrls = array.map(item => item.url || item.path || item.location || '');
              }
            }
          }
        }
      }
      
      // Filter out any empty URLs
      uploadedUrls = uploadedUrls.filter(url => url);
      
      // Log what we found
      console.log(`Extracted ${uploadedUrls.length} URLs from response:`, uploadedUrls);
      
      if (uploadedUrls.length > 0) {
        setUploadStatus({
          success: `Successfully uploaded ${uploadedUrls.length} files`,
          urls: uploadedUrls
        });
        
        if (onUploadComplete) {
          onUploadComplete(uploadedUrls, uploadedFiles);
        }
      } else {
        console.error('Could not extract URLs from response:', response.data);
        throw new Error('Invalid response format: No URLs found');
      }
    } else {
      // Single file upload
      console.log(`Uploading single file to ${uploadType} endpoint...`);
      response = await uploadImage(files[0], uploadType);
      console.log('Single upload response:', response);
      
      // Handle various possible response formats
      let fileUrl = '';
      let fileData = null;
      
      if (response.data) {
        if (response.data.file && response.data.file.url) {
          // Standard format
          fileUrl = response.data.file.url;
          fileData = response.data.file;
        } else if (response.data.url || response.data.path || response.data.location) {
          // Direct URL in data
          fileUrl = response.data.url || response.data.path || response.data.location;
          fileData = response.data;
        } else if (typeof response.data === 'string' && response.data.startsWith('http')) {
          // Direct URL string
          fileUrl = response.data;
          fileData = { url: response.data };
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          // Array response (take first item)
          const firstItem = response.data[0];
          if (typeof firstItem === 'string') {
            fileUrl = firstItem;
            fileData = { url: firstItem };
          } else if (firstItem && typeof firstItem === 'object') {
            fileUrl = firstItem.url || firstItem.path || firstItem.location || '';
            fileData = firstItem;
          }
        }
      }
      
      if (fileUrl) {
        setUploadStatus({
          success: 'File uploaded successfully',
          urls: [fileUrl]
        });
        
        if (onUploadComplete) {
          onUploadComplete(fileUrl, fileData);
        }
      } else {
        console.error('Could not extract URL from response:', response.data);
        throw new Error('Invalid response format: No URL found');
      }
    }
    
    // Clear files and previews after successful upload
    setFiles([]);
    setPreviews([]);
    
  } catch (error) {
    console.error('Upload error:', error);
    let errorMessage = 'Error uploading files';
    
    if (error.response) {
      console.error('Server error response:', error.response.data);
      errorMessage = error.response.data.message || 
                     `Server error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.request) {
      console.error('No response received:', error.request);
      errorMessage = 'No response received from server';
    } else {
      console.error('Error setting up request:', error.message);
      errorMessage = error.message || 'Error setting up upload request';
    }
    
    setUploadStatus({
      error: errorMessage
    });
    
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    setLoading(false);
    setUploadProgress(100);
    
    // Reset the progress after a delay
    setTimeout(() => {
      setUploadProgress(0);
    }, 2000);
  }
}; 