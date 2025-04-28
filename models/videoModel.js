const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter video title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Please enter video description"],
    },
    thumbnailUrl: {
      type: String,
      required: [true, "Please provide thumbnail url"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Please provide video url"],
      trim: true,
    },
    duration: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
      seconds: { type: Number, default: 0 },
    },
    language: {
      type: String,
      required: true,
      enum: ['English', 'Spanish', 'French', 'German', 'Italian','Arabic','Chinese','Japanese','korean'], 
      default: 'English'
    },
  
    // Geolocation settings
    geolocationSettings: {
      isGeolocationEnabled: {
        type: Boolean,
        default: false,
      },
      locations: [
        {
          // GeoJSON Point for storing coordinates
          type: {
            type: String,
            enum: ['Point'],
          
          },
          coordinates: {
            type: [Number],  // [longitude, latitude]
        
            validate: {
              validator: function(v) {
                return v.length === 2 && 
                       v[0] >= -180 && v[0] <= 180 && 
                       v[1] >= -90 && v[1] <= 90;
              },
              message: props => `${props.value} is not a valid coordinate!`
            }
          },
          radius: {
            type: Number,  // in meters
         
            min: [1, 'Radius must be at least 1 meter'],
            max: [100000, 'Radius cannot exceed 100km']
          },
          locationName: {
            type: String,
            trim: true
          },
       
        }
      ],   
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create geospatial index for location queries
videoSchema.index({ "geolocationSettings.locations.coordinates": '2dsphere' });

const Video = mongoose.model("Video", videoSchema);

module.exports = { Video };