const express = require('express');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const citySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    information : {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    days: {
      type: String,
      required: true,
    },
    itenary: {
        type: String,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const City = mongoose.model('City', citySchema);

module.exports = City;
