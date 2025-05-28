
const { Term } = require("../models/termModel");

const createTerm = async (req, res) => {
  const { language, content } = req.body;
  
  try {
    // Check if term with this language already exists
    const existingTerm = await Term.findOne({ language });
    if (existingTerm) {
      return res.status(400).json({
        success: false,
        message: `Terms & Conditions for ${language} already exist`
      });
    }

    const newTerm = new Term({ 
      language: language.trim(), 
      content 
    });
    
    await newTerm.save();
    
    res.status(201).json({
      success: true,
      data: newTerm
    });
    
  } catch (err) {
    // Handle duplicate key error (in case the unique check somehow fails)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Terms & Conditions for ${language} already exist`
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create term.', 
      error: err.message 
    });
  }
};
// Get All Terms
 const getTerms = async (req, res) => {
  try {
    const terms = await Term.find().sort({ createdAt: -1 });
    res.status(200).json(terms);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch terms.', error: err.message });
  }
};

// In your backend controller
const getTermByLanguage = async (req, res) => {
  try {
    const term = await Term.findOne({ language: req.params.language });
    if (!term) return res.status(404).json({ 
      success: false,
      message: 'Term not found.' 
    });
    res.status(200).json({
      success: true,
      data: term
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving term.', 
      error: err.message 
    });
  }
};

// Update Term
 const updateTerm = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const updatedTerm = await Term.findByIdAndUpdate(id, { content }, { new: true });
    if (!updatedTerm) return res.status(404).json({ message: 'Term not found.' });
    res.status(200).json(updatedTerm);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update term.', error: err.message });
  }
};

// Delete Term
 const deleteTerm = async (req, res) => {
  const { id } = req.params;
  try {
    await Term.findByIdAndDelete(id);
    res.status(200).json({ message: 'Term deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete term.', error: err.message });
  }
};
  module.exports = {
deleteTerm,createTerm,updateTerm,getTermByLanguage,getTerms
  };