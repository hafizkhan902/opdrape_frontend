import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProduct, updateProduct, getProductCategories, uploadImage } from '../../services/api';
import { 
  FaSave, 
  FaArrowLeft, 
  FaUpload, 
  FaTimes, 
  FaSpinner, 
  FaExclamationTriangle,
  FaTag,
  FaCheck,
  FaPlus,
  FaTrash
} from 'react-icons/fa';
import './AdminProductForm.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';
import ProductMetadataForm from './ProductMetadataForm';

// Valid size options that match the backend enum
const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isEditMode = !!id;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'men',
    subCategory: 'jeans',
    sku: '',
    description: '',
    features: [''],
    specifications: [{ key: '', value: '' }],
    careInstructions: [''],
    tags: [''],
    metadata: {
      isNewArrival: false,
      isBestSeller: false,
      isSale: false,
      salePercentage: 0
    },
    material: 'Cotton',
    brand: 'Opdrape',
    basePrice: '',
    salePrice: '',
    displayPage: null,
    isActive: true,
    vendor: '67d3438bdedb844ad5047029', // Default vendor ID
    image: null,
    colorVariants: [
      {
        color: {
          name: 'Blue',
          hexCode: '#0047AB'
        },
        sizes: [
          { name: 'S', quantity: 10 },
          { name: 'M', quantity: 15 },
          { name: 'L', quantity: 10 },
          { name: 'XL', quantity: 5 }
        ],
        images: []
      }
    ],
    discountPrice: '',
    isPublished: true,
    inStock: true,
    isFeatured: false,
    badges: [],
    shipping: {
      weight: '',
      dimensions: {
        height: '',
        width: '',
        depth: ''
      }
    }
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  // State for subcategories
  const [subCategories, setSubCategories] = useState({
    men: ['t-shirts', 'shirts', 'pants', 'jeans', 'jackets', 'sweaters', 'hoodies', 'shorts', 'activewear', 'underwear', 'socks', 'accessories'],
    women: ['t-shirts', 'shirts', 'pants', 'jeans', 'dresses', 'skirts', 'jackets', 'sweaters', 'hoodies', 'shorts', 'activewear', 'underwear', 'socks', 'accessories'],
    kids: ['t-shirts', 'shirts', 'pants', 'jeans', 'dresses', 'skirts', 'jackets', 'sweaters', 'hoodies', 'shorts', 'activewear', 'underwear', 'socks', 'accessories'],
    accessories: ['accessories']
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFiles, setImageFiles] = useState({});
  // Add state to track upload method for each variant
  const [uploadMethods, setUploadMethods] = useState({});
  
  // Load product data if in edit mode
  useEffect(() => {
    const loadProductData = async () => {
      if (isEditMode) {
        try {
          setProductLoading(true);
          console.log(`Loading product data for ID: ${id} in edit mode`);
          const response = await getProductById(id, true); // Pass isAdmin=true
          const product = response.data;
          
          console.log(`Product data loaded successfully:`, product);
          
          // Ensure category and subcategory match our valid options
          let category = product.category || 'Clothing';
          let subCategory = product.subCategory || '';
          
          // Check if the loaded category exists in our list and capitalize first letter if needed
          if (!categories.includes(category)) {
            // Try capitalizing first letter
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            if (categories.includes(capitalizedCategory)) {
              category = capitalizedCategory;
            } else {
              // Default to first category in list
              category = categories[0] || 'Clothing';
            }
          }
          
          // Check if the loaded subcategory is valid for the selected category
          if (subCategories[category] && !subCategories[category].includes(subCategory)) {
            // Default to first subcategory for this category
            subCategory = subCategories[category][0] || '';
          }
          
          // Transform the product data to match the form structure
          setFormData({
            name: product.name || '',
            price: product.price || '',
            stock: product.stock || '',
            category: category,
            subCategory: subCategory,
            sku: product.sku || '',
            description: product.description || '',
            features: product.features?.length > 0 ? product.features : [''],
            specifications: product.specifications?.length > 0 ? 
              product.specifications.map(spec => typeof spec === 'object' ? spec : { key: '', value: '' }) : 
              [{ key: '', value: '' }],
            careInstructions: product.careInstructions?.length > 0 ? product.careInstructions : [''],
            tags: product.tags?.length > 0 ? product.tags : [''],
            metadata: {
              isNewArrival: product.metadata?.isNewArrival || false,
              isBestSeller: product.metadata?.isBestSeller || false,
              isSale: product.metadata?.isSale || false,
              salePercentage: product.metadata?.salePercentage || 0,
              displayPage: product.metadata?.displayPage || null
            },
            material: product.material || 'Cotton',
            brand: product.brand || 'Opdrape',
            basePrice: product.basePrice || product.price || '',
            price: product.price || product.basePrice || '',
            displayPage: product.displayPage || null,
            isActive: product.isActive !== undefined ? product.isActive : true,
            vendor: product.vendor || '',
            image: null,
            colorVariants: product.colorVariants?.length > 0 ? product.colorVariants : [
              {
                color: {
                  name: 'Blue',
                  hexCode: '#0047AB'
                },
                sizes: [
                  { name: 'S', quantity: 10 },
                  { name: 'M', quantity: 15 },
                  { name: 'L', quantity: 10 },
                  { name: 'XL', quantity: 5 }
                ],
                images: []
              }
            ],
            discountPrice: product.discountPrice || '',
            isPublished: product.isPublished !== undefined ? product.isPublished : true,
            inStock: product.inStock !== undefined ? product.inStock : true,
            isFeatured: product.isFeatured !== undefined ? product.isFeatured : false,
            badges: product.badges || [],
            shipping: product.shipping || {
              weight: '',
              dimensions: {
                height: '',
                width: '',
                depth: ''
              }
            }
          });
          
          // If there's an image URL, set it as the preview
          if (product.image) {
            setImagePreview(product.image);
          }
          
          // If there are color variants with images, prepare them for the UI
          if (product.colorVariants && product.colorVariants.length > 0) {
            const variantImageFiles = {};
            
            product.colorVariants.forEach((variant, variantIndex) => {
              if (variant.images && variant.images.length > 0) {
                // Initialize the array for this variant if it doesn't exist
                if (!variantImageFiles[variantIndex]) {
                  variantImageFiles[variantIndex] = [];
                }
                
                // Set the existing images as previews
                variant.images.forEach(image => {
                  if (image.url) {
                    variantImageFiles[variantIndex].push({
                      preview: image.url,
                      alt: image.alt || '',
                      existing: true // Mark as existing so we don't re-upload
                    });
                  }
                });
              }
            });
            
            if (Object.keys(variantImageFiles).length > 0) {
              setImageFiles(variantImageFiles);
            }
          }
          
          setProductLoading(false);
        } catch (err) {
          console.error('Error loading product:', err);
          setErrors({ ...errors, product: 'Failed to load product data. Please try again.' });
          setProductLoading(false);
        }
      }
    };

    loadProductData();
  }, [id, isEditMode, categories]);
  
  // Load product categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        // This would normally be an API call
        // const response = await getProductCategories();
        // For now, we'll use values that match the backend enums
        setCategories([
          'men',
          'women',
          'kids',
          'accessories'
        ]);
        setCategoriesLoading(false);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);
  
  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category && subCategories[formData.category]) {
      if (!formData.subCategory || !subCategories[formData.category].includes(formData.subCategory)) {
        setFormData(prev => ({
          ...prev,
          subCategory: subCategories[formData.category][0] || ''
        }));
      }
    }
  }, [formData.category, subCategories]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for price and basePrice
    if (name === 'price') {
      // If changing price and basePrice is empty, also set basePrice
      if (!formData.basePrice && value) {
        setFormData(prev => ({
          ...prev,
          price: value,
          basePrice: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          price: value
        }));
      }
    } 
    // If basePrice is changed and its now less than current price, update price too
    else if (name === 'basePrice' && parseFloat(value) < parseFloat(formData.price)) {
      setFormData(prev => ({
        ...prev,
        basePrice: value,
        price: value // Update price if basePrice becomes lower
      }));
    }
    else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
    
    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle feature changes
  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    
    setFormData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  // Add a new feature
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };
  
  // Remove a feature
  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      features: updatedFeatures.length > 0 ? updatedFeatures : ['']
    }));
  };
  
  // Handle specification changes
  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...formData.specifications];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      specifications: updatedSpecs
    }));
  };
  
  // Add a new specification
  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };
  
  // Remove a specification
  const removeSpecification = (index) => {
    const updatedSpecs = [...formData.specifications];
    updatedSpecs.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      specifications: updatedSpecs.length > 0 ? updatedSpecs : [{ key: '', value: '' }]
    }));
  };
  
  // Handle image upload for a color variant
  const handleImageUpload = (variantIndex, imageUrl) => {
    console.log(`Single image uploaded for variant ${variantIndex}:`, imageUrl);
    
    const updatedVariants = [...formData.colorVariants];
    
    // Add the new image
    updatedVariants[variantIndex].images.push({
      url: imageUrl,
      alt: `${formData.name} ${updatedVariants[variantIndex].color.name}`
    });
    
    setFormData(prev => ({
      ...prev,
      colorVariants: updatedVariants
    }));
  };
  
  // Handle multiple image upload for a color variant
  const handleMultipleImageUpload = (variantIndex, urls, files) => {
    console.log(`Multiple images uploaded for variant ${variantIndex}:`, urls);
    
    // Check if urls is valid
    if (!urls || (!Array.isArray(urls) && typeof urls !== 'string')) {
      console.error('Invalid urls received from image uploader:', urls);
      setErrors({ ...errors, image: 'Invalid response from image upload. Please try again.' });
      return;
    }
    
    const updatedVariants = [...formData.colorVariants];
    
    // Handle different response formats
    let processedUrls = [];
    
    if (typeof urls === 'string') {
      // Single URL string
      processedUrls = [urls];
    } else if (Array.isArray(urls)) {
      // Array of URLs or objects
      processedUrls = urls.map(url => {
        if (typeof url === 'string') {
          return url;
        } else if (url && typeof url === 'object') {
          // Handle object with url property
          return url.url || url.path || url.location || url.src || '';
        }
        return '';
      }).filter(url => url); // Filter out empty URLs
    }
    
    console.log('Processed image URLs:', processedUrls);
    
    // Add all new images
    const newImages = processedUrls.map(url => ({
      url: url,
      alt: `${formData.name} ${updatedVariants[variantIndex].color.name}`
    }));
    
    console.log('Adding new images to variant:', newImages);
    
    updatedVariants[variantIndex].images = [
      ...updatedVariants[variantIndex].images,
      ...newImages
    ];
    
    setFormData(prev => ({
      ...prev,
      colorVariants: updatedVariants
    }));
    
    // Store the uploaded files if needed
    if (files) {
      setImageFiles(prev => ({
        ...prev,
        [`variant-${variantIndex}`]: files
      }));
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.basePrice) {
      errors.basePrice = 'Base price is required';
    } else if (isNaN(formData.basePrice) || parseFloat(formData.basePrice) <= 0) {
      errors.basePrice = 'Base price must be a positive number';
    }
    
    if (formData.discountPrice && (isNaN(formData.discountPrice) || parseFloat(formData.discountPrice) <= 0)) {
      errors.discountPrice = 'Discount price must be a positive number';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.subCategory) {
      errors.subCategory = 'Sub-category is required';
    }
    
    if (!formData.material || !formData.material.trim()) {
      errors.material = 'Material is required';
    }
    
    // Validate metadata fields
    const metadataErrors = {};
    
    if (formData.metadata.isSale) {
      if (formData.metadata.salePercentage === undefined || formData.metadata.salePercentage === null) {
        metadataErrors.salePercentage = 'Sale percentage is required for sale items';
      } else if (isNaN(formData.metadata.salePercentage) || formData.metadata.salePercentage <= 0 || formData.metadata.salePercentage > 100) {
        metadataErrors.salePercentage = 'Sale percentage must be between 1 and 100';
      }
    }
    
    if (Object.keys(metadataErrors).length > 0) {
      errors.metadata = metadataErrors;
    }
    
    // Validate color variants
    if (!formData.colorVariants || formData.colorVariants.length === 0) {
      errors.colorVariants = 'At least one color variant is required';
    } else {
      // Check each color variant
      const variantErrors = [];
      
      formData.colorVariants.forEach((variant, index) => {
        const variantError = {};
        
        // Check color
        if (!variant.color || !variant.color.name.trim()) {
          variantError.colorName = 'Color name is required';
        }
        
        if (!variant.color || !variant.color.hexCode.trim()) {
          variantError.colorHex = 'Color hex code is required';
        }
        
        // Check sizes
        if (!variant.sizes || variant.sizes.length === 0) {
          variantError.sizes = 'At least one size is required';
        } else {
          const sizeErrors = [];
          
          variant.sizes.forEach((size, sizeIndex) => {
            const sizeError = {};
            
            if (!size.name.trim()) {
              sizeError.name = 'Size name is required';
            } else if (!VALID_SIZES.includes(size.name)) {
              sizeError.name = 'Please select a valid size';
            }
            
            if (size.quantity === undefined || size.quantity < 0) {
              sizeError.quantity = 'Quantity must be a non-negative number';
            }
            
            if (Object.keys(sizeError).length > 0) {
              sizeErrors[sizeIndex] = sizeError;
            }
          });
          
          if (sizeErrors.length > 0) {
            variantError.sizeErrors = sizeErrors;
          }
        }
        
        if (Object.keys(variantError).length > 0) {
          variantErrors[index] = variantError;
        }
      });
      
      if (variantErrors.length > 0) {
        errors.variantErrors = variantErrors;
      }
    }
    
    // Log validation results
    console.log('Validation errors:', errors);
    setErrors(errors);
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setErrors({});
    
    // Validate form data
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Format the product data for API
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || undefined,
        basePrice: parseFloat(formData.basePrice) || undefined,
        category: formData.category,
        subCategory: formData.subCategory,
        brand: formData.brand || undefined,
        material: formData.material,
        sku: formData.sku || '',
        features: formData.features.filter(feature => feature.trim() !== ''),
        careInstructions: formData.careInstructions.filter(instruction => instruction.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        isPublished: formData.isPublished,
        inStock: formData.inStock,
        isFeatured: formData.isFeatured,
        vendor: formData.vendor || undefined,
        metadata: {
          isNewArrival: formData.metadata.isNewArrival,
          isBestSeller: formData.metadata.isBestSeller,
          isSale: formData.metadata.isSale,
          salePercentage: formData.metadata.isSale ? parseInt(formData.metadata.salePercentage) : 0,
          displayPage: formData.metadata.displayPage
        },
        colorVariants: formData.colorVariants.map(variant => ({
          color: {
            name: variant.color.name,
            hexCode: variant.color.hexCode
          },
          sizes: variant.sizes.map(size => ({
            name: size.name,
            quantity: parseInt(size.quantity)
          })),
          images: variant.images.map(image => ({
            url: image.url,
            alt: image.alt || ''
          }))
        }))
      };

      // Include optional fields if they exist
      if (formData.discountPrice) {
        productPayload.discountPrice = parseFloat(formData.discountPrice);
      }

      if (formData.badges && formData.badges.length > 0) {
        productPayload.badges = formData.badges;
      }

      if (formData.specifications && formData.specifications.length > 0) {
        productPayload.specifications = formData.specifications.map(spec => ({
          name: spec.name,
          value: spec.value
        }));
      }

      if (formData.shipping) {
        const shipping = {};
        
        if (formData.shipping.weight) {
          shipping.weight = parseFloat(formData.shipping.weight);
        }
        
        if (formData.shipping.dimensions) {
          const { height, width, depth } = formData.shipping.dimensions;
          
          if (height || width || depth) {
            shipping.dimensions = {};
            
            if (height) shipping.dimensions.height = parseFloat(height);
            if (width) shipping.dimensions.width = parseFloat(width);
            if (depth) shipping.dimensions.depth = parseFloat(depth);
          }
        }
        
        if (Object.keys(shipping).length > 0) {
          productPayload.shipping = shipping;
        }
      }

      let response;
      if (id) {
        // Update existing product
        console.log(`Updating existing product with ID ${id}...`);
        response = await updateProduct(id, productPayload);
        
        // Show success message
        toast.success('Product updated successfully!');
        setSuccess('Product updated successfully! Redirecting to product list...');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/admin/products');
        }, 1500);
      } else {
        // Create new product
        console.log('Creating new product...');
        response = await createProduct(productPayload);
        
        // Show success message
        toast.success('Product created successfully!');
        setSuccess('Product created successfully! You can add another product or return to the list.');
      }

      console.log(`Product ${id ? 'updated' : 'created'} with response:`, response.data);

      // If creating a new product, reset the form
      if (!id) {
        // Reset form when creating a new product
        setFormData({
          name: '',
          price: '',
          stock: '',
          category: 'men',
          subCategory: 'jeans',
          sku: '',
          description: '',
          features: [''],
          specifications: [{ key: '', value: '' }],
          careInstructions: [''],
          tags: [''],
          metadata: {
            isNewArrival: false,
            isBestSeller: false,
            isSale: false,
            salePercentage: 0
          },
          displayPage: null,
          isActive: true,
          vendor: '67d3438bdedb844ad5047029', // Default vendor ID
          image: null,
          basePrice: '',
          material: 'Cotton',
          brand: 'Opdrape',
          colorVariants: [
            {
              color: {
                name: 'Blue',
                hexCode: '#0047AB'
              },
              sizes: [
                { name: 'S', quantity: 10 },
                { name: 'M', quantity: 15 },
                { name: 'L', quantity: 10 },
                { name: 'XL', quantity: 5 }
              ],
              images: []
            }
          ],
          discountPrice: '',
          isPublished: true,
          inStock: true,
          isFeatured: false,
          badges: [],
          shipping: {
            weight: '',
            dimensions: {
              height: '',
              width: '',
              depth: ''
            }
          }
        });
        
        // Clear form state
        setImagePreview(null);
        setImageFiles({});
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving product:', error);
      setLoading(false);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.errors) {
          // Validation errors from the server
          const serverErrors = {};
          
          // Map server validation errors to form fields
          Object.entries(data.errors).forEach(([field, message]) => {
            serverErrors[field] = Array.isArray(message) ? message[0] : message;
          });
          
          setErrors(serverErrors);
          toast.error('Please correct the validation errors.');
        } else if (status === 401 || status === 403) {
          // Authentication or authorization error
          toast.error('You do not have permission to perform this action.');
          setErrors({ form: 'You do not have permission to perform this action.' });
        } else if (status === 404) {
          // Product not found (for updates)
          toast.error('Product not found. It may have been deleted.');
          setErrors({ form: 'Product not found. It may have been deleted.' });
        } else if (status === 500) {
          // Server error
          toast.error('Server error occurred. Please try again later.');
          setErrors({ form: 'Server error occurred. Please try again later.' });
        } else {
          // Generic error with server response
          const errorMessage = data.message || 'An error occurred while saving the product.';
          toast.error(errorMessage);
          setErrors({ form: errorMessage });
        }
      } else if (error.request) {
        // Request made but no response received
        toast.error('Unable to connect to the server. Please check your internet connection.');
        setErrors({ form: 'Unable to connect to the server. Please check your internet connection.' });
      } else {
        // Error in request setup
        toast.error('An error occurred while preparing the request.');
        setErrors({ form: error.message || 'An error occurred while preparing the request.' });
      }
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/products');
  };
  
  // Show loading state when fetching product data
  if (productLoading) {
    return (
      <div className="admin-product-form-container">
        <div className="loading-state">
          <FaSpinner className="loading-icon fa-spin" />
          <h2>Loading product data...</h2>
        </div>
      </div>
    );
  }
  
  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL) => {
    if (!dataURL || typeof dataURL !== 'string' || !dataURL.startsWith('data:')) {
      console.error('Invalid data URL:', dataURL);
      throw new Error('Invalid data URL format');
    }

    try {
      const arr = dataURL.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      
      if (!mimeMatch || !arr[1]) {
        console.error('Invalid data URL format:', dataURL.substring(0, 50) + '...');
        throw new Error('Invalid data URL format');
      }
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error('Error converting data URL to blob:', error);
      throw new Error('Failed to convert image data. Please try uploading again.');
    }
  };
  
  // Add color variant handler functions
  const addColorVariant = () => {
    const newVariant = {
      color: {
        name: '',
        hexCode: '#cccccc'
      },
      sizes: [],
      images: []
    };
    
    setFormData({
      ...formData,
      colorVariants: [...formData.colorVariants, newVariant]
    });
  };
  
  const removeColorVariant = (variantIndex) => {
    const updatedVariants = formData.colorVariants.filter((_, index) => index !== variantIndex);
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  const handleColorVariantChange = (variantIndex, field, subField, value) => {
    const updatedVariants = [...formData.colorVariants];
    
    if (subField) {
      updatedVariants[variantIndex][field][subField] = value;
    } else {
      updatedVariants[variantIndex][field] = value;
    }
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  const addSize = (variantIndex) => {
    const updatedVariants = [...formData.colorVariants];
    const newSize = {
      name: VALID_SIZES[0], // Use the first size from the valid sizes
      quantity: 0
    };
    
    if (!updatedVariants[variantIndex].sizes) {
      updatedVariants[variantIndex].sizes = [];
    }
    
    updatedVariants[variantIndex].sizes.push(newSize);
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
    const updatedVariants = [...formData.colorVariants];
    
    // If field is quantity, convert value to number
    if (field === 'quantity') {
      value = parseInt(value) || 0;
    }
    
    updatedVariants[variantIndex].sizes[sizeIndex][field] = value;
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  const removeSize = (variantIndex, sizeIndex) => {
    const updatedVariants = [...formData.colorVariants];
    updatedVariants[variantIndex].sizes = updatedVariants[variantIndex].sizes.filter(
      (_, index) => index !== sizeIndex
    );
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  // Add the handleImageUploadMethodChange function
  const handleImageUploadMethodChange = (variantIndex, method) => {
    setUploadMethods({
      ...uploadMethods,
      [variantIndex]: method
    });
  };

  // Add function to handle link input
  const handleVariantImageLink = (variantIndex, e) => {
    const imageUrl = e.target.value.trim();
    
    // Store the link for later validation/submission
    setFormData(prev => {
      const updatedVariants = [...prev.colorVariants];
      if (!updatedVariants[variantIndex].linkInputValue) {
        updatedVariants[variantIndex].linkInputValue = imageUrl;
      } else {
        updatedVariants[variantIndex].linkInputValue = imageUrl;
      }
      return {
        ...prev,
        colorVariants: updatedVariants
      };
    });
  };

  // Add function to submit the image link
  const submitImageLink = (variantIndex) => {
    const variant = formData.colorVariants[variantIndex];
    const imageUrl = variant.linkInputValue;
    
    if (!imageUrl) {
      toast.error('Please enter a valid image URL');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(imageUrl);
      
      // Add the image to the variant's images array
      handleAddVariantImage(variantIndex, {
        url: imageUrl,
        alt: 'Product image'
      });
      
      // Clear the input value
      setFormData(prev => {
        const updatedVariants = [...prev.colorVariants];
        updatedVariants[variantIndex].linkInputValue = '';
        return {
          ...prev,
          colorVariants: updatedVariants
        };
      });
      
      toast.success('Image link added successfully');
    } catch (e) {
      toast.error('Please enter a valid URL');
    }
  };

  // Modify the existing handleVariantImageUpload to include null check for e.target
  const handleVariantImageUpload = async (variantIndex, e) => {
    if (!e || !e.target || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Use the existing uploadImage service
      const response = await uploadImage(file, 'products');
      
      // Extract URL from response
      let imageUrl = '';
      if (response.data.file && response.data.file.url) {
        imageUrl = response.data.file.url;
      } else if (response.data.url) {
        imageUrl = response.data.url;
      } else if (typeof response.data === 'string') {
        imageUrl = response.data;
      }
      
      if (!imageUrl) {
        throw new Error('No image URL found in response');
      }
      
      // Add the image to the variant's images array
      handleAddVariantImage(variantIndex, {
        url: imageUrl,
        alt: file.name
      });
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };
  
  const handleAddVariantImage = (variantIndex, image) => {
    const updatedVariants = [...formData.colorVariants];
    
    if (!updatedVariants[variantIndex].images) {
      updatedVariants[variantIndex].images = [];
    }
    
    updatedVariants[variantIndex].images.push(image);
    
    setFormData(prevData => ({
      ...prevData,
      colorVariants: updatedVariants
    }));
  };
  
  const handleVariantImageChange = (variantIndex, imageIndex, field, value) => {
    const updatedVariants = [...formData.colorVariants];
    updatedVariants[variantIndex].images[imageIndex][field] = value;
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  const removeVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...formData.colorVariants];
    updatedVariants[variantIndex].images = updatedVariants[variantIndex].images.filter(
      (_, index) => index !== imageIndex
    );
    
    setFormData({
      ...formData,
      colorVariants: updatedVariants
    });
  };
  
  // Handle metadata change
  const handleMetadataChange = (newMetadata) => {
    setFormData({
      ...formData,
      metadata: newMetadata
    });
  };
  
  // Handle care instruction changes
  const handleCareInstructionChange = (index, value) => {
    const updatedInstructions = [...formData.careInstructions];
    updatedInstructions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      careInstructions: updatedInstructions
    }));
  };

  // Add a new care instruction
  const addCareInstruction = () => {
    setFormData(prev => ({
      ...prev,
      careInstructions: [...prev.careInstructions, '']
    }));
  };

  // Remove a care instruction
  const removeCareInstruction = (index) => {
    const updatedInstructions = [...formData.careInstructions];
    updatedInstructions.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      careInstructions: updatedInstructions.length > 0 ? updatedInstructions : ['']
    }));
  };

  // Handle tag changes
  const handleTagChange = (index, value) => {
    const updatedTags = [...formData.tags];
    updatedTags[index] = value;
    
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  // Add a new tag
  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  // Remove a tag
  const removeTag = (index) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      tags: updatedTags.length > 0 ? updatedTags : ['']
    }));
  };
  
  return (
    <div className="admin-product-form-container">
      <div className="admin-product-form-header">
        <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
        <div className="action-buttons">
          <button
            className="cancel-button"
            type="button"
            onClick={() => navigate('/admin/products')}
          >
            <FaArrowLeft /> Back to Products
          </button>
        </div>
      </div>
      
      {/* Display loading state for product data */}
      {productLoading && (
        <div className="loading-overlay">
          <FaSpinner className="loading-icon" />
          <p>Loading product data...</p>
        </div>
      )}
      
      {/* Display success message */}
      {success && (
        <div className="form-success-message">
          <FaCheck />
          <p>{success}</p>
        </div>
      )}
      
      {/* Display form-level error message */}
      {errors.form && (
        <div className="form-error-message">
          <FaExclamationTriangle />
          <p>{errors.form}</p>
        </div>
      )}
      
      {/* Display product loading error */}
      {errors.product && (
        <div className="form-error-message">
          <FaExclamationTriangle />
          <p>{errors.product}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-column">
            <div className="form-section">
              <h3>Basic Information</h3>
            <div className="form-group">
                <label>Product Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                  className={errors.name ? 'error' : ''}
              />
                {errors.name && <p className="error-message">{errors.name}</p>}
            </div>
            
            <div className="form-row">
                <div className="form-group half-width">
                  <label>Price (BDT) <span className="required">*</span></label>
                <input
                    type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                    placeholder="Enter product price"
                    className={errors.price ? 'error' : ''}
                />
                  {errors.price && <p className="error-message">{errors.price}</p>}
                  <p className="help-text">Current selling price (with any discounts applied)</p>
              </div>
              
                <div className="form-group half-width">
                  <label>Base Price (BDT) <span className="required">*</span></label>
                <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                  onChange={handleInputChange}
                    placeholder="Enter base price"
                    className={errors.basePrice ? 'error' : ''}
                />
                  {errors.basePrice && <p className="error-message">{errors.basePrice}</p>}
                  <p className="help-text">Original price before any discounts</p>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Product Metadata</h3>
              <ProductMetadataForm 
                metadata={formData.metadata}
                onChange={handleMetadataChange}
                errors={errors.metadata || {}}
              />
            </div>

            <div className="form-section">
              <h3>Categories & Attributes</h3>
            <div className="form-row">
                <div className="form-group half-width">
                  <label>Category <span className="required">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                    className={errors.category ? 'error' : ''}
                >
                    <option value="">Select Category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                  {errors.category && <p className="error-message">{errors.category}</p>}
              </div>
              
                <div className="form-group half-width">
                  <label>Sub-Category</label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Sub-Category</option>
                    {subCategories[formData.category] && subCategories[formData.category].map((subCategory, index) => (
                      <option key={index} value={subCategory}>{subCategory}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Brand</label>
                <input
                  type="text"
                    name="brand"
                    value={formData.brand}
                  onChange={handleInputChange}
                    placeholder="Enter brand name"
                  />
                </div>
                
                <div className="form-group half-width">
                  <label>Material <span className="required">*</span></label>
                  <select
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className={errors.material ? 'error' : ''}
                  >
                    <option value="">Select Material</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Polyester">Polyester</option>
                    <option value="Linen">Linen</option>
                    <option value="Silk">Silk</option>
                    <option value="Wool">Wool</option>
                    <option value="Denim">Denim</option>
                    <option value="Leather">Leather</option>
                    <option value="Cashmere">Cashmere</option>
                    <option value="Rayon">Rayon</option>
                    <option value="Nylon">Nylon</option>
                    <option value="Spandex">Spandex</option>
                    <option value="Blend">Blend</option>
                  </select>
                  {errors.material && <p className="error-message">{errors.material}</p>}
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Description</h3>
            <div className="form-group">
                <label>Description <span className="required">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                  rows="5"
                  className={errors.description ? 'error' : ''}
              ></textarea>
                {errors.description && <p className="error-message">{errors.description}</p>}
            </div>
          </div>
          
            <div className="form-section">
              <h3>Inventory</h3>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="Enter stock quantity"
                  />
                  </div>
                
                <div className="form-group half-width">
                  <label>SKU</label>
                      <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Enter SKU"
                  />
                  </div>
              </div>
            </div>
            </div>
            
          <div className="form-column">
            <div className="form-section">
              <h3>Product Features</h3>
            <div className="form-group">
                <label>Features</label>
              <div className="features-list">
                {formData.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="Add a product feature"
                    />
                      {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                          className="remove-feature"
                    >
                          <FaTrash />
                    </button>
                      )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFeature}
                  className="add-feature"
              >
                <FaPlus /> Add Feature
              </button>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Specifications</h3>
            <div className="form-group">
                <label>Product Specifications</label>
              <div className="specifications-list">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="spec-item">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                        placeholder="Specification name"
                        className="spec-key"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                        placeholder="Specification value"
                        className="spec-value"
                    />
                      {formData.specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                          className="remove-spec"
                    >
                          <FaTrash />
                    </button>
                      )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSpecification}
                  className="add-spec"
              >
                <FaPlus /> Add Specification
              </button>
            </div>
          </div>

            <div className="form-section">
              <h3>Care Instructions</h3>
              <div className="form-group">
                <label>Care Instructions</label>
                <div className="features-list">
                  {formData.careInstructions.map((instruction, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => handleCareInstructionChange(index, e.target.value)}
                        placeholder="Add care instruction"
                      />
                      {formData.careInstructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCareInstruction(index)}
                          className="remove-feature"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCareInstruction}
                  className="add-feature"
                >
                  <FaPlus /> Add Care Instruction
                </button>
              </div>
            </div>

            <div className="form-section">
              <h3>Product Tags</h3>
              <div className="form-group">
                <label>Tags</label>
                <div className="features-list">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleTagChange(index, e.target.value)}
                        placeholder="Add a tag"
                      />
                      {formData.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="remove-feature"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="add-feature"
                >
                  <FaPlus /> Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Color Variants</h3>
          
          <div className="color-variants-list">
            {formData.colorVariants.length > 0 ? (
              formData.colorVariants.map((variant, index) => (
                <div key={index} className="color-variant-item">
                  <div className="variant-header">
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: variant.color.hexCode || '#cccccc' }}
                    ></div>
                    <h4>{variant.color.name || 'Color Variant'}</h4>
                    <button
                      type="button"
                      className="remove-variant"
                      onClick={() => removeColorVariant(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="variant-color-section">
                    <div className="variant-field">
                      <label>Color Name*</label>
                      <input
                        type="text"
                        value={variant.color.name || ''}
                        onChange={(e) => handleColorVariantChange(index, 'color', 'name', e.target.value)}
                        placeholder="e.g., Blue, Red, Black"
                      />
                      {errors.variantErrors && errors.variantErrors[index] && 
                        errors.variantErrors[index].colorName && 
                        <div className="error">{errors.variantErrors[index].colorName}</div>
                      }
                    </div>
                    
                    <div className="variant-field">
                      <label>Color Hex Code*</label>
                      <div className="color-input-group">
                        <input
                          type="text"
                          value={variant.color.hexCode || ''}
                          onChange={(e) => handleColorVariantChange(index, 'color', 'hexCode', e.target.value)}
                          placeholder="e.g., #0047AB"
                        />
                        <input
                          type="color"
                          value={variant.color.hexCode || '#cccccc'}
                          onChange={(e) => handleColorVariantChange(index, 'color', 'hexCode', e.target.value)}
                        />
                      </div>
                      {errors.variantErrors && errors.variantErrors[index] && 
                        errors.variantErrors[index].colorHex && 
                        <div className="error">{errors.variantErrors[index].colorHex}</div>
                      }
                    </div>
                  </div>
                  
                  <div className="variant-sizes-section">
                    <label>Sizes & Inventory*</label>
                    <div className="sizes-list">
                      {variant.sizes && variant.sizes.map((size, sizeIndex) => (
                        <div key={sizeIndex} className="size-item">
                          <div className="size-input-group">
                            <select
                              value={size.name}
                              onChange={(e) => handleSizeChange(index, sizeIndex, 'name', e.target.value)}
                              className="size-name"
                            >
                              <option value="">Select Size</option>
                              {VALID_SIZES.map(sizeOption => (
                                <option key={sizeOption} value={sizeOption}>
                                  {sizeOption}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={size.quantity}
                              onChange={(e) => handleSizeChange(index, sizeIndex, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="size-quantity"
                              min="0"
                            />
                            <button
                              type="button"
                              className="remove-size"
                              onClick={() => removeSize(index, sizeIndex)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                          {errors.variantErrors && errors.variantErrors[index] && 
                            errors.variantErrors[index].sizeErrors && 
                            errors.variantErrors[index].sizeErrors[sizeIndex] && 
                            <div className="error">
                              {errors.variantErrors[index].sizeErrors[sizeIndex].name || 
                               errors.variantErrors[index].sizeErrors[sizeIndex].quantity}
                            </div>
                          }
                        </div>
                      ))}
                    </div>
                    {variant.sizes && variant.sizes.length === 0 && 
                      errors.variantErrors && 
                      errors.variantErrors[index] && 
                      errors.variantErrors[index].sizes && 
                      <div className="error">{errors.variantErrors[index].sizes}</div>
                    }
                    <button
                      type="button"
                      className="add-size"
                      onClick={() => addSize(index)}
                    >
                      <FaPlus /> Add Size
                    </button>
                  </div>
                  
                  <div className="variant-images-section">
                    <label>Variant Images</label>
                    <div className="variant-images-grid">
                      {variant.images && variant.images.map((image, imageIndex) => (
                        <div key={imageIndex} className="variant-image-item">
                          <img src={image.url} alt={image.alt || 'Product image'} />
                          <div className="image-actions">
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() => removeVariantImage(index, imageIndex)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={image.alt || ''}
                            onChange={(e) => handleVariantImageChange(index, imageIndex, 'alt', e.target.value)}
                            placeholder="Image alt text"
                            className="image-alt"
                          />
                        </div>
                      ))}
                      <div className="add-variant-image">
                        <div className="upload-method-selector">
                          <select 
                            value={uploadMethods[index] || 'upload'}
                            onChange={(e) => handleImageUploadMethodChange(index, e.target.value)}
                            className="upload-method-select"
                          >
                            <option value="upload">Upload Image</option>
                            <option value="link">Image URL</option>
                          </select>
                        </div>
                        
                        {(uploadMethods[index] || 'upload') === 'upload' ? (
                          <label className="upload-label">
                            <FaUpload />
                            <span>Add Image</span>
                            <input
                              type="file"
                              onChange={(e) => handleVariantImageUpload(index, e)}
                              accept="image/jpeg, image/png, image/gif"
                              style={{ display: 'none' }}
                            />
                          </label>
                        ) : (
                          <div className="image-link-input">
                            <input
                              type="text"
                              value={variant.linkInputValue || ''}
                              onChange={(e) => handleVariantImageLink(index, e)}
                              placeholder="Enter image URL"
                              className="image-url-input"
                            />
                            <button 
                              type="button"
                              onClick={() => submitImageLink(index)}
                              className="add-link-button"
                            >
                              <FaPlus /> Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-variants">
                <p>No color variants added yet.</p>
              </div>
            )}
          </div>
          {errors.colorVariants && <div className="error">{errors.colorVariants}</div>}
          <button
            type="button"
            className="add-color-variant"
            onClick={addColorVariant}
          >
            <FaPlus /> Add Color Variant
          </button>
        </div>
        
        {/* Form footer */}
        <div className="form-footer">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="fa-spin" /> Saving...
              </>
            ) : (
              <>
                <FaSave /> {isEditMode ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm; 