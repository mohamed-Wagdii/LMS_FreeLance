const Lesson = require('../models/Lesson');
const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');
const { frappeResponse, sendFrappeError } = require('../utils/frappeResponse');

exports.getLesson = async (req, res) => {
    try {
        const { course, chapter_number, lesson_number, lesson } = req.body;
        
        let lessonObj;
        
        if (lesson) {
            lessonObj = await Lesson.findOne({ name: lesson })
                .populate('chapter', 'name title idx')
                .populate('course', 'name title');
        } else if (course && chapter_number !== undefined && lesson_number !== undefined) {
            const courseObj = await Course.findOne({ name: course });
            if (!courseObj) return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Course not found", indicator: "red"}]) });
            
            const chapterObj = await Chapter.findOne({ course: courseObj._id, idx: chapter_number });
            if (!chapterObj) return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Chapter not found", indicator: "red"}]) });
            
            lessonObj = await Lesson.findOne({ chapter: chapterObj._id, idx: lesson_number })
                .populate('chapter', 'name title idx')
                .populate('course', 'name title');
        }
        
        if (!lessonObj) {
            return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Lesson not found", indicator: "red"}]) });
        }
        
        let is_complete = false;
        if (req.user) {
            const progress = await LessonProgress.findOne({ lesson: lessonObj._id, user: req.user._id });
            if (progress) is_complete = progress.is_complete;
        }
        
        const responseData = {
            name: lessonObj.name,
            title: lessonObj.title,
            content: lessonObj.content,
            body: lessonObj.body,
            instructor_notes: lessonObj.instructor_notes,
            chapter: {
                name: lessonObj.chapter.name,
                title: lessonObj.chapter.title,
                idx: lessonObj.chapter.idx
            },
            course: {
                name: lessonObj.course.name,
                title: lessonObj.course.title
            },
            idx: lessonObj.idx,
            include_in_preview: lessonObj.include_in_preview,
            youtube_video_id: lessonObj.youtube_video_id,
            video_link: lessonObj.video_link,
            is_complete,
            number: `${lessonObj.chapter.idx + 1}.${lessonObj.idx + 1}`
        };
        
        res.json(frappeResponse(responseData));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.getCreationDetails = async (req, res) => {
    try {
        const { course } = req.body;
        const courseObj = await Course.findOne({ name: course });
        if (!courseObj) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Course not found", indicator: "red"}]) });
        }
        res.json(frappeResponse(courseObj));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.createLesson = async (req, res) => {
    try {
        const { title, chapter, course, content, body, instructor_notes, include_in_preview, youtube_video_id, video_link } = req.body;
        
        const chapterObj = await Chapter.findOne({ name: chapter });
        if (!chapterObj) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Chapter not found", indicator: "red"}]) });
        }
        
        const courseObj = await Course.findOne({ name: course });
        
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
        
        const maxLesson = await Lesson.findOne({ chapter: chapterObj._id }).sort('-idx');
        const newIdx = maxLesson ? maxLesson.idx + 1 : 0;
        
        const newLesson = new Lesson({
            name: slug,
            title,
            chapter: chapterObj._id,
            course: courseObj ? courseObj._id : null,
            content,
            body,
            instructor_notes,
            include_in_preview,
            youtube_video_id,
            video_link,
            idx: newIdx
        });
        
        await newLesson.save();
        res.json(frappeResponse(newLesson));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const { lesson } = req.body;
        
        const lessonObj = await Lesson.findOne({ name: lesson });
        if (!lessonObj) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Lesson not found", indicator: "red"}]) });
        }
        
        await LessonProgress.deleteMany({ lesson: lessonObj._id });
        await Lesson.deleteOne({ _id: lessonObj._id });
        
        res.json(frappeResponse({ message: "Lesson deleted successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.updateLessonIndex = async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            await Promise.all(req.body.map(async (item) => {
                const updateData = { idx: item.idx };
                if (item.chapter) {
                    const ch = await Chapter.findOne({ name: item.chapter });
                    if (ch) updateData.chapter = ch._id;
                }
                await Lesson.updateOne({ name: item.name }, { $set: updateData });
            }));
        } else {
            const { name, idx, chapter } = req.body;
            const updateData = { idx };
            if (chapter) {
                const ch = await Chapter.findOne({ name: chapter });
                if (ch) updateData.chapter = ch._id;
            }
            await Lesson.updateOne({ name }, { $set: updateData });
        }
        
        res.json(frappeResponse({ message: "Lesson index updated successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.saveProgress = async (req, res) => {
    try {
        const { lesson, course } = req.body;
        
        const lessonObj = await Lesson.findOne({ name: lesson });
        const courseObj = await Course.findOne({ name: course });
        
        if (!lessonObj || !courseObj) {
            return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Lesson or course not found", indicator: "red"}]) });
        }
        
        let progress = await LessonProgress.findOne({ lesson: lessonObj._id, user: req.user._id });
        if (!progress) {
            progress = new LessonProgress({
                lesson: lessonObj._id,
                user: req.user._id,
                is_complete: true
            });
        } else {
            progress.is_complete = true;
        }
        await progress.save();
        
        // Calculate overall course progress
        const chapterIds = (await Chapter.find({ course: courseObj._id })).map(c => c._id);
        const totalLessons = await Lesson.countDocuments({ chapter: { $in: chapterIds } });
        
        const completedLessons = await LessonProgress.countDocuments({ 
            user: req.user._id, 
            is_complete: true,
            lesson: { $in: await Lesson.find({ chapter: { $in: chapterIds } }).distinct('_id') }
        });
        
        const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        await Enrollment.updateOne(
            { course: courseObj._id, user: req.user._id },
            { $set: { progress: overallProgress } }
        );
        
        res.json(frappeResponse({ progress: overallProgress }));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.markProgress = async (req, res) => {
    try {
        const { lesson, is_complete } = req.body;
        
        const lessonObj = await Lesson.findOne({ name: lesson });
        if (!lessonObj) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Lesson not found", indicator: "red"}]) });
        }
        
        let progress = await LessonProgress.findOne({ lesson: lessonObj._id, user: req.user._id });
        if (!progress) {
            progress = new LessonProgress({
                lesson: lessonObj._id,
                user: req.user._id,
                is_complete
            });
        } else {
            progress.is_complete = is_complete;
        }
        await progress.save();
        
        // Recalculate progress if needed, similar to saveProgress
        if (lessonObj.course) {
            const courseObj = await Course.findById(lessonObj.course);
            if (courseObj) {
                const chapterIds = (await Chapter.find({ course: courseObj._id })).map(c => c._id);
                const totalLessons = await Lesson.countDocuments({ chapter: { $in: chapterIds } });
                const completedLessons = await LessonProgress.countDocuments({ 
                    user: req.user._id, 
                    is_complete: true,
                    lesson: { $in: await Lesson.find({ chapter: { $in: chapterIds } }).distinct('_id') }
                });
                
                const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
                
                await Enrollment.updateOne(
                    { course: courseObj._id, user: req.user._id },
                    { $set: { progress: overallProgress } }
                );
            }
        }
        
        res.json(frappeResponse({ message: "Progress marked successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};

exports.trackVideo = async (req, res) => {
    try {
        const { lesson, duration } = req.body;
        
        const lessonObj = await Lesson.findOne({ name: lesson });
        if (!lessonObj) {
             return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Lesson not found", indicator: "red"}]) });
        }
        
        let progress = await LessonProgress.findOne({ lesson: lessonObj._id, user: req.user._id });
        if (!progress) {
            progress = new LessonProgress({
                lesson: lessonObj._id,
                user: req.user._id,
                video_watch_duration: duration
            });
        } else {
            progress.video_watch_duration = duration;
        }
        await progress.save();
        
        res.json(frappeResponse({ message: "Duration tracked successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'LessonControllerError');
    }
};
