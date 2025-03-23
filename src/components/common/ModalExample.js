import React, { useState } from 'react';
import Modal from './Modal';

/**
 * Example component to demonstrate different ways to use the Modal component
 */
const ModalExample = () => {
  // State for each modal
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isWithFooterModalOpen, setIsWithFooterModalOpen] = useState(false);
  const [isLargeModalOpen, setIsLargeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Common button style
  const buttonStyle = {
    padding: '8px 16px',
    background: '#4a69bd',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    margin: '10px 10px 10px 0',
    cursor: 'pointer',
  };

  // Form state for the form modal
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would handle form submission here
    alert(`Form submitted with:\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}`);
    setIsFormModalOpen(false);
  };

  return (
    <div className="modal-examples">
      <h2>Modal Component Examples</h2>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3>Modal Types</h3>
        <p>Click the buttons below to open different types of modals:</p>

        <button 
          style={buttonStyle} 
          onClick={() => setIsBasicModalOpen(true)}
        >
          Basic Modal
        </button>

        <button 
          style={buttonStyle} 
          onClick={() => setIsWithFooterModalOpen(true)}
        >
          Modal with Footer
        </button>

        <button 
          style={buttonStyle} 
          onClick={() => setIsLargeModalOpen(true)}
        >
          Large Modal
        </button>

        <button 
          style={buttonStyle} 
          onClick={() => setIsConfirmModalOpen(true)}
        >
          Confirmation Modal
        </button>

        <button 
          style={buttonStyle} 
          onClick={() => setIsFormModalOpen(true)}
        >
          Form Modal
        </button>
      </div>

      {/* Basic Modal */}
      <Modal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        title="Basic Modal"
      >
        <p>This is a basic modal with just a title and content. Click the X or outside the modal to close it.</p>
        <p>You can also press the ESC key to close this modal.</p>
      </Modal>

      {/* Modal with Footer */}
      <Modal
        isOpen={isWithFooterModalOpen}
        onClose={() => setIsWithFooterModalOpen(false)}
        title="Modal with Footer"
        footer={
          <>
            <button 
              style={{ 
                ...buttonStyle, 
                background: '#ccc', 
                color: '#333',
                margin: 0 
              }} 
              onClick={() => setIsWithFooterModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              style={{ ...buttonStyle, margin: 0 }} 
              onClick={() => setIsWithFooterModalOpen(false)}
            >
              Save Changes
            </button>
          </>
        }
      >
        <p>This modal includes a footer with action buttons.</p>
        <p>The footer is useful for adding actions like "Save", "Cancel", etc.</p>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={isLargeModalOpen}
        onClose={() => setIsLargeModalOpen(false)}
        title="Large Modal"
        size="large"
      >
        <h4>Section 1</h4>
        <p>This is a large modal that can contain more content and has more width.</p>
        
        <h4>Section 2</h4>
        <p>You can use this for displaying detailed information, large forms, or other content that needs more space.</p>
        
        <h4>Section 3</h4>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        
        <h4>Section 4</h4>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Delete"
        size="small"
        footer={
          <>
            <button 
              style={{ 
                ...buttonStyle, 
                background: '#ccc', 
                color: '#333',
                margin: 0 
              }} 
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              style={{ 
                ...buttonStyle, 
                background: '#f44336',
                margin: 0 
              }} 
              onClick={() => {
                alert('Item deleted!');
                setIsConfirmModalOpen(false);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#f44336" 
            strokeWidth="2" 
            style={{ marginBottom: '15px' }}
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
          <p style={{ fontWeight: 'bold' }}>Are you sure you want to delete this item?</p>
          <p>This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Contact Form"
        footer={
          <>
            <button 
              style={{ 
                ...buttonStyle, 
                background: '#ccc', 
                color: '#333',
                margin: 0 
              }} 
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              style={{ 
                ...buttonStyle, 
                margin: 0,
                background: '#4caf50' 
              }} 
              type="submit"
              form="contact-form"
            >
              Submit
            </button>
          </>
        }
      >
        <form id="contact-form" onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="name" 
              style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
            >
              Name
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="email" 
              style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
            >
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="message" 
              style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
            >
              Message
            </label>
            <textarea 
              id="message" 
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                minHeight: '100px'
              }}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ModalExample;