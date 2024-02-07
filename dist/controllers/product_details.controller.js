import Label from "../models/label.model.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";
import Warranty from "../models/warranty.model.js";
class ProductDetailController {
    async productDetailPage(req, res, next) {
        try {
            /**
             * @param dsN can be DS1 or DS2
             * @param link contain product name, product id, batch number and serial number
             */
            const { dsN, link } = req.params;
            // Concate the DS1 or DS2 with link
            let dsNLink = dsN + '/' + link;
            // Find DS1 or DS2 in the label collections
            const label = await Label.findOne({ [dsN]: { $in: dsNLink } });
            let dsNErrorMessage = '';
            // Show message a/c to the dsN Type
            if (dsN === 'DS1') {
                dsNErrorMessage = "Missing label 010";
            }
            else if (dsN === 'DS2') {
                dsNErrorMessage = "Missing label 020";
            }
            // If the DS1 or DS2 not found in the label collections
            // it will give this error 010 missing label message
            if (!label)
                throw new ErrorResponse(400, dsNErrorMessage);
            let ownerMobile = label.owner_mobile;
            let isOwnerMobileNumberFound = "";
            // We can determine the label status by the mobile number 
            // And give message a/c to this.
            if (ownerMobile) {
                if (dsN === 'DS1') {
                    isOwnerMobileNumberFound = `This product is owned by ${ownerMobile}`;
                }
                else if (dsN === 'DS2') {
                    isOwnerMobileNumberFound = `This product is sold to ${ownerMobile}`;
                }
            }
            else {
                if (dsN === 'DS1') {
                    isOwnerMobileNumberFound = `No error in label`;
                }
                else if (dsN === 'DS2') {
                    // Here we will update the label attribute (ownerMobile)
                    // with the number of the logged in end user
                }
            }
            const [product, brand, warranty] = await Promise.all([
                Product.findById(label.product_id),
                Brand.findById(label.brand_id),
                Warranty.findOne({ DS1: link }).select('_id')
            ]);
            if (!product || !brand)
                throw new ErrorResponse(400, "Details with this labels are not valid");
            const labelDetails = {
                brand_id: label.brand_id,
                product_id: label.product_id
            };
            let carouselDetails = {};
            if (product && product?.images?.length !== 0) {
                carouselDetails.carousel_images = product.images;
                carouselDetails.carousel_headings = product.carousel_headings;
                carouselDetails.carousel_text = product.carousel_text;
            }
            else {
                carouselDetails.carousel_images = brand?.images;
                carouselDetails.carousel_headings = brand?.carousel_headings;
                carouselDetails.carousel_text = brand?.carousel_text;
            }
            let supportDetails = {
                reOrderLink: brand.re_order_link,
                survey: {
                    isSupport: brand.survey_feature,
                    via: brand.survey_link
                }
            };
            let productDetails = {
                name: product.name,
                brandName: brand.name,
                image: carouselDetails.carousel_images[0],
                variants: product.variants,
                description: product.product_description,
                feature: product.feature,
                warranty: brand.warranty,
                helpRequest: brand.request_help,
                isAlreadyReg: warranty?.id || null,
                company_id: brand.company_id,
                dsN,
                link
            };
            let contactDetails = {
                email: {
                    isSupport: brand.email_support,
                    via: `mailto:${brand.email_id}`
                },
                phone: {
                    isSupport: brand.call_support,
                    via: `tel:${brand.call_no}`
                },
                whatsapp: {
                    isSupport: brand.whatsapp_support,
                    via: `https://wa.me/${brand.whatsapp_number}`
                },
                instagram: {
                    isSupport: brand.instagram,
                    via: brand.insta_link
                },
                facebook: {
                    isSupport: brand.facebook,
                    via: brand.fb_link
                },
            };
            res.status(200).json({
                success: true,
                data: {
                    isOwnerMobileNumberFound,
                    ownerMobile,
                    supportDetails,
                    carouselDetails,
                    productDetails,
                    contactDetails,
                    labelDetails
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new ProductDetailController();
//# sourceMappingURL=product_details.controller.js.map