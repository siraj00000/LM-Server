import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRequestHelpOnLabel extends Document {
  DS1: string;
  request_date: Date;
  product_id: mongoose.Schema.Types.ObjectId;
  company_id: mongoose.Schema.Types.ObjectId;
  brand_id: mongoose.Schema.Types.ObjectId;
  help_ref_num: string;
  address: string;
  pincode: string;
}

const requestHelpOnLabelSchema: Schema<IRequestHelpOnLabel> = new mongoose.Schema({
  DS1: {
    type: String,
    required: [true, "DS1 is required."],
  },
  request_date: {
    type: Date,
    required: [true, "Request date is required."],
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Product ID is required."],
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Company ID is required."],
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Brand ID is required."],
  },
  help_ref_num: {
    type: String,
    required: [true, "Help reference number is required."],
  },
  address: {
    type: String,
    required: [true, "Address is required."],
  },
  pincode: {
    type: String,
    required: [true, "Pincode is required."],
  },
}, {
  timestamps: true
});

const RequestHelpOnLabel: Model<IRequestHelpOnLabel> = mongoose.model<IRequestHelpOnLabel>('RequestHelpOnLabel', requestHelpOnLabelSchema);

export default RequestHelpOnLabel;