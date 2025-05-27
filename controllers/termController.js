
const { Term } = require("../models/termModel");

// Create Term
 const createTerm = async (req, res) => {
  const { language, content } = req.body;
  try {
    const newTerm = new Term({ language, content });
    await newTerm.save();
    res.status(201).json(newTerm);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create term.', error: err.message });
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

// Get Term by Language
 const getTermByLanguage = async (req, res) => {
  try {
    const term = await Term.findOne({ language: req.params.language });
    if (!term) return res.status(404).json({ message: 'Term not found.' });
    res.status(200).json(term);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving term.', error: err.message });
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