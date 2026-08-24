const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../utils/frappeResponse');

// Models mapping
const getModelForDoctype = (doctype) => {
    switch (doctype) {
        case 'LMS Course':
            return require('../models/Course');
        case 'Course Chapter':
            return require('../models/Chapter');
        case 'Course Lesson':
            return require('../models/Lesson');
        case 'LMS Enrollment':
            return require('../models/Enrollment');
        case 'User':
            return require('../models/User');
        default:
            return null;
    }
};

// Build MongoDB filter from Frappe filters
const buildMongoFilter = (filters) => {
    if (!filters) return {};
    
    let mongoFilter = {};
    
    if (Array.isArray(filters)) {
        filters.forEach(filter => {
            if (Array.isArray(filter) && filter.length === 3) {
                const [field, operator, value] = filter;
                switch (operator.toLowerCase()) {
                    case '=':
                        mongoFilter[field] = value;
                        break;
                    case '!=':
                        mongoFilter[field] = { $ne: value };
                        break;
                    case 'like':
                        mongoFilter[field] = { $regex: value.replace(/%/g, ''), $options: 'i' };
                        break;
                    case '>':
                        mongoFilter[field] = { $gt: value };
                        break;
                    case '<':
                        mongoFilter[field] = { $lt: value };
                        break;
                    case '>=':
                        mongoFilter[field] = { $gte: value };
                        break;
                    case '<=':
                        mongoFilter[field] = { $lte: value };
                        break;
                    case 'in':
                        mongoFilter[field] = { $in: Array.isArray(value) ? value : [value] };
                        break;
                    case 'not in':
                        mongoFilter[field] = { $nin: Array.isArray(value) ? value : [value] };
                        break;
                    case 'is':
                        if (value === 'set') mongoFilter[field] = { $exists: true, $ne: null };
                        if (value === 'not set') mongoFilter[field] = { $eq: null };
                        break;
                    default:
                        mongoFilter[field] = value;
                }
            }
        });
    } else if (typeof filters === 'object') {
        Object.keys(filters).forEach(key => {
            mongoFilter[key] = filters[key];
        });
    }
    
    return mongoFilter;
};

// POST /api/method/frappe.client.get
router.post('/api/method/frappe.client.get', async (req, res) => {
    try {
        let { doctype, name, filters } = req.body;
        
        if (typeof req.body === 'string') {
            try { req.body = JSON.parse(req.body); } catch(e) {}
            doctype = req.body.doctype;
            name = req.body.name;
            filters = req.body.filters;
        }

        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        let doc;
        if (name) {
            doc = await Model.findOne({ name });
        } else if (filters) {
            const mongoFilter = buildMongoFilter(typeof filters === 'string' ? JSON.parse(filters) : filters);
            doc = await Model.findOne(mongoFilter);
        }

        if (!doc) {
            return errorResponse(res, `Document not found`, 'NotFoundError');
        }

        return successResponse(res, doc);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.get_list
router.post('/api/method/frappe.client.get_list', async (req, res) => {
    try {
        let { doctype, fields, filters, order_by, limit_start, limit_page_length, or_filters } = req.body;
        
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        let parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        let mongoFilter = buildMongoFilter(parsedFilters);

        if (or_filters) {
            let parsedOrFilters = typeof or_filters === 'string' ? JSON.parse(or_filters) : or_filters;
            let orMongoFilters = buildMongoFilter(parsedOrFilters);
            if (Object.keys(orMongoFilters).length > 0) {
                mongoFilter = { ...mongoFilter, $or: Object.keys(orMongoFilters).map(key => ({ [key]: orMongoFilters[key] })) };
            }
        }

        let query = Model.find(mongoFilter);

        // Sorting
        if (order_by) {
            const [field, order] = order_by.split(' ');
            const sortObj = {};
            sortObj[field] = order.toLowerCase() === 'desc' ? -1 : 1;
            query = query.sort(sortObj);
        } else {
            query = query.sort({ creation: -1 });
        }

        // Pagination
        const skip = limit_start ? parseInt(limit_start, 10) : 0;
        const limit = limit_page_length ? parseInt(limit_page_length, 10) : 20;
        query = query.skip(skip).limit(limit);

        // Selection
        if (fields && fields !== '*' && fields !== '["*"]') {
            let fieldsArr = typeof fields === 'string' ? JSON.parse(fields) : fields;
            if (Array.isArray(fieldsArr) && !fieldsArr.includes('name')) {
                fieldsArr.push('name');
            }
            if (Array.isArray(fieldsArr)) {
                query = query.select(fieldsArr.join(' '));
            }
        }

        const docs = await query.exec();
        return successResponse(res, docs);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.get_count
router.post('/api/method/frappe.client.get_count', async (req, res) => {
    try {
        const { doctype, filters } = req.body;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        const mongoFilter = buildMongoFilter(typeof filters === 'string' ? JSON.parse(filters) : filters);
        const count = await Model.countDocuments(mongoFilter);
        
        return successResponse(res, count);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.get_value
router.post('/api/method/frappe.client.get_value', async (req, res) => {
    try {
        const { doctype, fieldname, filters } = req.body;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        const mongoFilter = buildMongoFilter(typeof filters === 'string' ? JSON.parse(filters) : filters);
        const doc = await Model.findOne(mongoFilter);
        
        if (!doc) {
            return successResponse(res, {});
        }

        let result = {};
        let fieldsArr = Array.isArray(fieldname) ? fieldname : [fieldname];
        fieldsArr.forEach(field => {
            result[field] = doc[field];
        });

        return successResponse(res, result);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.get_single_value
router.post('/api/method/frappe.client.get_single_value', async (req, res) => {
    try {
        const { doctype, field } = req.body;
        
        // For settings doctypes, mock values
        if (doctype === 'LMS Settings' || doctype === 'System Settings') {
            return successResponse(res, true);
        }

        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        const doc = await Model.findOne();
        return successResponse(res, doc ? doc[field] : null);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.insert
router.post('/api/method/frappe.client.insert', async (req, res) => {
    try {
        let { doc } = req.body;
        if (typeof doc === 'string') {
            doc = JSON.parse(doc);
        }

        const doctype = doc.doctype;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        if (doc.title && !doc.name) {
            doc.name = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        if (doctype === 'LMS Course') {
            doc.owner = req.user ? req.user.email : 'admin@lms.com';
        }

        const newDoc = new Model(doc);
        await newDoc.save();

        return successResponse(res, newDoc);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.set_value
router.post('/api/method/frappe.client.set_value', async (req, res) => {
    try {
        const { doctype, name, fieldname, value } = req.body;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        let updateObj = {};
        if (typeof fieldname === 'object') {
            updateObj = fieldname;
        } else {
            updateObj[fieldname] = value;
        }

        const updatedDoc = await Model.findOneAndUpdate(
            { name },
            { $set: updateObj },
            { new: true }
        );

        if (!updatedDoc) {
            return errorResponse(res, `Document not found`, 'NotFoundError');
        }

        return successResponse(res, updatedDoc);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.delete
router.post('/api/method/frappe.client.delete', async (req, res) => {
    try {
        const { doctype, name } = req.body;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        const doc = await Model.findOne({ name });
        if (!doc) {
            return errorResponse(res, `Document not found`, 'NotFoundError');
        }

        await Model.deleteOne({ name });

        if (doctype === 'LMS Course') {
            const Chapter = getModelForDoctype('Course Chapter');
            const Lesson = getModelForDoctype('Course Lesson');
            const Enrollment = getModelForDoctype('LMS Enrollment');
            
            if (Chapter) await Chapter.deleteMany({ course: doc.name });
            if (Lesson) await Lesson.deleteMany({ course: doc.name });
            if (Enrollment) await Enrollment.deleteMany({ course: doc.name });
        }

        return successResponse(res, 'ok');
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

// POST /api/method/frappe.client.rename_doc
router.post('/api/method/frappe.client.rename_doc', async (req, res) => {
    try {
        const { doctype, old, new: newName } = req.body;
        const Model = getModelForDoctype(doctype);
        if (!Model) {
            return errorResponse(res, `Doctype ${doctype} not found`, 'NotFoundError');
        }

        const updatedDoc = await Model.findOneAndUpdate(
            { name: old },
            { $set: { name: newName } },
            { new: true }
        );

        if (!updatedDoc) {
            return errorResponse(res, `Document not found`, 'NotFoundError');
        }

        return successResponse(res, newName);
    } catch (error) {
        return errorResponse(res, error.message);
    }
});

module.exports = router;
