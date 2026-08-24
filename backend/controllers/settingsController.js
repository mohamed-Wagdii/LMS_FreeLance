const { successResponse, errorResponse } = require('../utils/frappeResponse');

exports.getBranding = (req, res) => {
    try {
        const data = {
            brand_name: 'LMS Platform',
            brand_logo: null,
            favicon: null,
            brand_color: '#4563F1',
            hide_login_signup: false
        };
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

exports.getSettings = (req, res) => {
    try {
        const data = {
            allow_guest_access: true,
            force_published_course: false,
            default_currency: 'USD',
            show_job_openings: false,
            show_statistics: true,
            enable_learning_paths: false,
            enable_certification: false,
            enforce_lesson_completion: false,
            show_reviews: true,
            enable_coupons: false,
            is_onboarding_complete: true,
            custom_sidebar_items: []
        };
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

exports.getSidebarSettings = (req, res) => {
    try {
        const data = {
            sidebar_items: [
                { label: 'Courses', route: '/courses', icon: 'BookOpen', public: true },
                { label: 'Batches', route: '/batches', icon: 'Users', public: false },
                { label: 'Quizzes', route: '/quizzes', icon: 'HelpCircle', public: false },
                { label: 'Assignments', route: '/assignments', icon: 'FileText', public: false },
                { label: 'Job Openings', route: '/job-openings', icon: 'Briefcase', public: false },
                { label: 'Statistics', route: '/statistics', icon: 'BarChart', public: false }
            ]
        };
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

exports.getNotifications = (req, res) => {
    try {
        const data = { notifications: [], unread_count: 0 };
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

exports.getPermissions = (req, res) => {
    try {
        const { doctypes } = req.body;
        if (!doctypes || !Array.isArray(doctypes)) {
            return successResponse(res, {});
        }
        
        const permissions = {};
        const isModerator = req.user && req.user.roles && req.user.roles.includes('Moderator');
        
        doctypes.forEach(doctype => {
            if (isModerator) {
                permissions[doctype] = { read: true, write: true, create: true, delete: true };
            } else {
                permissions[doctype] = { read: true, write: false, create: false, delete: false };
            }
        });
        
        return successResponse(res, permissions);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
