const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { frappeResponse, sendFrappeError } = require('../utils/frappeResponse');

exports.getCourses = async (req, res) => {
    try {
        const { page_length = 10, start = 0, category, search, status, text } = req.body;
        
        let filter = {};
        
        const searchQuery = search || text;
        if (searchQuery) {
            filter.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = category;
        }

        if (status === 'enrolled' && req.user) {
            const enrollments = await Enrollment.find({ user: req.user._id });
            const enrolledCourseIds = enrollments.map(e => e.course);
            filter._id = { $in: enrolledCourseIds };
        } else if (status === 'created' && req.user) {
            filter.owner = req.user._id;
        } else {
            if (status !== 'created') {
               filter.published = true;
            }
        }

        const courses = await Course.find(filter)
            .sort({ createdAt: -1 })
            .skip(Number(start))
            .limit(Number(page_length))
            .populate('instructors', 'full_name email user_image username')
            .populate('owner', 'full_name email user_image');

        const courseData = await Promise.all(courses.map(async (course) => {
            const student_count = await Enrollment.countDocuments({ course: course._id });
            const chapterIds = (await Chapter.find({ course: course._id })).map(c => c._id);
            const lesson_count = await Lesson.countDocuments({ chapter: { $in: chapterIds } });
            
            return {
                name: course.name,
                title: course.title,
                short_introduction: course.short_introduction,
                image: course.image,
                published: course.published,
                upcoming: course.upcoming,
                paid_course: course.paid_course,
                course_price: course.course_price,
                currency: course.currency,
                tags: course.tags,
                instructors: course.instructors,
                owner: course.owner,
                student_count,
                avg_rating: 0,
                lesson_count
            };
        }));

        res.json(frappeResponse(courseData));
    } catch (error) {
        sendFrappeError(res, error, 'CourseControllerError');
    }
};

exports.getCourseCount = async (req, res) => {
    try {
        const all_courses = await Course.countDocuments({});
        const live = await Course.countDocuments({ published: true });
        let enrolled = 0;
        let created = 0;

        if (req.user) {
            enrolled = await Enrollment.countDocuments({ user: req.user._id });
            created = await Course.countDocuments({ owner: req.user._id });
        }

        res.json(frappeResponse({ all_courses, live, enrolled, created }));
    } catch (error) {
        sendFrappeError(res, error, 'CourseControllerError');
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { course: courseName } = req.body;
        
        const course = await Course.findOne({ name: courseName })
            .populate('instructors', 'full_name email user_image username')
            .populate('owner', 'full_name email user_image');
            
        if (!course) {
            return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Course not found", indicator: "red"}]) });
        }

        let enrollment = null;
        if (req.user) {
            enrollment = await Enrollment.findOne({ course: course._id, user: req.user._id });
        }

        const student_count = await Enrollment.countDocuments({ course: course._id });
        const chapters = await Chapter.find({ course: course._id });
        const chapterIds = chapters.map(c => c._id);
        const lesson_count = await Lesson.countDocuments({ chapter: { $in: chapterIds } });
        
        const courseDetails = {
            ...course.toObject(),
            membership: enrollment ? { member: req.user.email, progress: enrollment.progress, is_member: true } : null,
            instructors: course.instructors,
            student_count,
            avg_rating: 0,
            rating: 0,
            quiz_count: 0,
            chapter_count: chapters.length,
            lesson_count,
            enrolled: !!enrollment
        };

        res.json(frappeResponse(courseDetails));
    } catch (error) {
        sendFrappeError(res, error, 'CourseControllerError');
    }
};

exports.getCourseOutline = async (req, res) => {
    try {
        const { course: courseName } = req.body;
        
        const course = await Course.findOne({ name: courseName });
        if (!course) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Course not found", indicator: "red"}]) });
        }

        const chapters = await Chapter.find({ course: course._id }).sort({ idx: 1 });
        
        const chaptersWithLessons = await Promise.all(chapters.map(async (chapter) => {
            const lessons = await Lesson.find({ chapter: chapter._id }).sort({ idx: 1 });
            
            const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
                let is_complete = false;
                if (req.user) {
                    const LessonProgress = require('../models/LessonProgress');
                    const progress = await LessonProgress.findOne({ lesson: lesson._id, user: req.user._id });
                    if (progress) {
                        is_complete = progress.is_complete;
                    }
                }
                
                return {
                    name: lesson.name,
                    title: lesson.title,
                    idx: lesson.idx,
                    is_complete,
                    include_in_preview: lesson.include_in_preview,
                    youtube_video_id: lesson.youtube_video_id,
                    video_link: lesson.video_link
                };
            }));
            
            return {
                name: chapter.name,
                title: chapter.title,
                description: chapter.description,
                idx: chapter.idx,
                is_scorm_package: chapter.is_scorm_package || false,
                lessons: lessonsWithProgress
            };
        }));

        res.json(frappeResponse({ chapters: chaptersWithLessons }));
    } catch (error) {
        sendFrappeError(res, error, 'CourseControllerError');
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Course.distinct('category', { category: { $ne: null, $ne: '' } });
        res.json(frappeResponse(categories));
    } catch (error) {
        sendFrappeError(res, error, 'CourseControllerError');
    }
};
