import React, { useState } from 'react';
import './PopupForm.css';

interface Education {
  id: string;
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface Certification {
  id: string;
  title: string;
  description: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  educations: Education[];
  certifications: Certification[];
  resume: File | null;
}

interface PopupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
  };
  isLoading?: boolean;
  error?: string | null;
}

const PopupForm: React.FC<PopupFormProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    linkedinUrl: initialData?.linkedinUrl || '',
    educations: [],
    certifications: [],
    resume: null
  });

  // Return null if the popup shouldn't be displayed
  if (!isOpen) return null;
  
  // Function to handle closing the popup
  const handleClose = () => {
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, resume: e.target.files![0] }));
    }
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      location: '',
      degree: '',
      startDate: '',
      endDate: ''
    };
    setFormData(prev => ({
      ...prev,
      educations: [...prev.educations, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter(edu => edu.id !== id)
    }));
  };

  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      title: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (id: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate at least one education
    if (formData.educations.length === 0) {
      alert('At least one education entry is required.');
      return;
    }
    // Validate resume
    if (!formData.resume) {
      alert('Resume is required.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <button type="button" className="popup-close-button" onClick={handleClose}>
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <h1 className="popup-title">Tap My Talent</h1>
          <p className="popup-subtitle">Please enter some basic details to proceed:</p>

          <div className="popup-form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="popup-form-input"
              required
            />
          </div>

          <div className="popup-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="popup-form-input"
              required
            />
          </div>

          <div className="popup-form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="popup-form-input"
              required
            />
          </div>

          <div className="popup-form-group">
            <label>LinkedIn URL</label>
            <input
              type="url"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              className="popup-form-input"
            />
          </div>

          {/* Education Section */}
          <div className="popup-form-section">
            <div className="section-header">
              <h2>Education <span className="dropdown-icon">▼</span></h2>
              <p className="section-note">At least one education entry is required</p>
            </div>

            {formData.educations.map(education => (
              <div key={education.id} className="education-item">
                <div className="popup-form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={education.institution}
                    onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                    className="popup-form-input"
                    required
                  />
                </div>

                <div className="popup-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={education.location}
                    onChange={(e) => updateEducation(education.id, 'location', e.target.value)}
                    className="popup-form-input"
                    required
                  />
                </div>

                <div className="popup-form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={education.degree}
                    onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                    className="popup-form-input"
                    required
                  />
                </div>

                <div className="date-row">
                  <div className="popup-form-group date-field">
                    <label>Start Date</label>
                    <input
                      type="text"
                      value={education.startDate}
                      onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                      className="popup-form-input"
                      placeholder="MM/YYYY"
                      required
                    />
                  </div>
                  <div className="popup-form-group date-field">
                    <label>End Date</label>
                    <input
                      type="text"
                      value={education.endDate}
                      onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                      className="popup-form-input"
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="remove-button"
                  onClick={() => removeEducation(education.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button 
              type="button" 
              className="add-button"
              onClick={addEducation}
            >
              + Add Education
            </button>
          </div>

          {/* Certifications Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>Certifications <span className="dropdown-icon">▼</span></h2>
              <p className="section-note">Optional, add any relevant certifications</p>
            </div>

            {formData.certifications.map(certification => (
              <div key={certification.id} className="certification-item">
                <div className="popup-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={certification.title}
                    onChange={(e) => updateCertification(certification.id, 'title', e.target.value)}
                    className="popup-form-input"
                    required
                  />
                </div>

                <div className="popup-form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={certification.description}
                    onChange={(e) => updateCertification(certification.id, 'description', e.target.value)}
                    className="popup-form-input"
                  />
                </div>

                <button 
                  type="button" 
                  className="remove-button"
                  onClick={() => removeCertification(certification.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button 
              type="button" 
              className="add-button"
              onClick={addCertification}
            >
              + Add Certifications
            </button>
          </div>

          {/* Resume Upload */}
          <div className="popup-form-group">
            <label>Resume</label>
            <p className="section-note">Upload your Resume</p>
            <div className="upload-container">
              <label className="upload-label">
                <span><i className="upload-icon"></i> Drop/Upload</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="file-input"
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
          <div className="form-footer">
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupForm;
