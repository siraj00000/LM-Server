import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IErrorReport extends Document {
  company_id: mongoose.Schema.Types.ObjectId;
  brand_id: mongoose.Schema.Types.ObjectId;
  product_id: mongoose.Schema.Types.ObjectId;
  store_and_location: string;
  purchase_date: string;
  store_pin_code: string;
}

const errorReportSchema: Schema<IErrorReport> = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Invalid Company Info!'],
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Brand ID is required !!"],
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Product ID is required !!"],
    },
    store_and_location: {
      type: String,
      required: [true, "Store and Location is required !!"],
    },
    purchase_date: {
      type: String,
      required: [true, "Purchase date is required !!"],
    },
    store_pin_code: {
      type: String,
      required: [true, "Store pin code is required !!"],
    },
  },
  { timestamps: true }
);

const ErrorReport: Model<IErrorReport> = mongoose.model<IErrorReport>('error_reports', errorReportSchema);

export default ErrorReport;
