'use client';

import { useState, FormEvent } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({});
    
    // Simulate API call
    try {
      // In a real application, you would send the form data to your API
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      setSubmitStatus({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch {
      // Error
      setSubmitStatus({
        success: false,
        message: 'There was an error sending your message. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="card mb-8">
          <p className="mb-6">
            Have questions about our Web Scraping API? Need help with implementation?
            Fill out the form below and our team will get back to you as soon as possible.
          </p>
          
          {submitStatus.message && (
            <div className={`alert ${submitStatus.success ? 'alert-success' : 'alert-error'} mb-6`}>
              {submitStatus.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject" className="form-label">Subject</label>
              <select
                id="subject"
                name="subject"
                className="form-select"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                name="message"
                className="form-input h-32"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner mr-2"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Email Us</h2>
            <p className="mb-2">
              For general inquiries:
            </p>
            <p className="text-blue-600 mb-4">
              info@webscrapingapi.com
            </p>
            <p className="mb-2">
              For technical support:
            </p>
            <p className="text-blue-600">
              support@webscrapingapi.com
            </p>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Business Hours</h2>
            <p className="mb-2">
              Monday - Friday:
            </p>
            <p className="mb-4">
              9:00 AM - 6:00 PM EST
            </p>
            <p className="mb-2">
              Response Time:
            </p>
            <p>
              We aim to respond to all inquiries within 24 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 