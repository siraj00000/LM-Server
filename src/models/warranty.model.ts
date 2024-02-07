import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWarrantyRegistration extends Document {
  DS1: string;
  company_id: mongoose.Schema.Types.ObjectId;
  warranty_activated: boolean;
  purchase_date: string;
  store_name: string;
  store_pin_code: string;
  warranty_duration: string;
  invoice_number: string;
  invoice_image: string;
  pincode: string;
  address1: string;
  address2?: string;
}

const warrantyRegistrationSchema: Schema<IWarrantyRegistration> = new mongoose.Schema({
  DS1: {
    type: String,
    required: [true, "Unable to find the label !!"],
    unique: true,
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Invalid Company Info!'],
  },
  warranty_activated: {
    type: Boolean,
    required: [true, 'Warranty activation status is required.']
  },
  purchase_date: {
    type: String,
    required: [true, 'Purchase date is required.']
  },
  store_name: {
    type: String,
    required: [true, 'Store name is required.']
  },
  store_pin_code: {
    type: String,
    unique: true,
    required: [true, 'Store pin code is required.']
  },
  warranty_duration: {
    type: String,
    required: [true, 'Warranty duration is required.']
  },
  invoice_number: {
    type: String,
    required: [true, 'Invoice number is required.']
  },
  invoice_image: {
    type: String,
    required: [true, 'Invoice image URL is required.']
  },
  pincode: {
    type: String,
    required: [true, 'Pin code is required.']
  },
  address1: {
    type: String,
    required: [true, "Please provide your store address."],
  },
  address2: {
    type: String,
  },
}, {
  timestamps: true
});

const Warranty: Model<IWarrantyRegistration> = mongoose.model<IWarrantyRegistration>('warranty', warrantyRegistrationSchema);

export default Warranty;
