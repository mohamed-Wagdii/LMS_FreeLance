const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { frappeResponse, sendFrappeError } = require('../utils/frappeResponse');

exports.upsertChapter = async (req, res) => {
    try {
        const { chapter, title, description, course, idx } = req.body;
        
        let chapterObj;
        
        if (chapter) {
            chapterObj = await Chapter.findOne({ name: chapter });
            if (chapterObj) {
                if (title) chapterObj.title = title;
                if (description) chapterObj.description = description;
                if (idx !== undefined) chapterObj.idx = idx;
                await chapterObj.save();
                return res.json(frappeResponse(chapterObj));
            }
        }
        
        const courseObj = await Course.findOne({ name: course });
        if (!courseObj) {
            return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Course not found", indicator: "red"}]) });
        }
        
        let newIdx = idx;
        if (newIdx === undefined) {
            const maxChapter = await Chapter.findOne({ course: courseObj._id }).sort('-idx');
            newIdx = maxChapter ? maxChapter.idx + 1 : 0;
        }
        
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + courseObj.name;
        
        chapterObj = new Chapter({
            name: slug,
            title,
            description,
            course: courseObj._id,
            idx: newIdx
        });
        
        await chapterObj.save();
        res.json(frappeResponse(chapterObj));
    } catch (error) {
        sendFrappeError(res, error, 'ChapterControllerError');
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        const { chapter } = req.body;
        
        const chapterObj = await Chapter.findOne({ name: chapter });
        if (!chapterObj) {
            return res.status(404).json({ exc_type: 'NotFound', _server_messages: JSON.stringify([{message: "Chapter not found", indicator: "red"}]) });
        }
        
        await Lesson.deleteMany({ chapter: chapterObj._id });
        await Chapter.deleteOne({ _id: chapterObj._id });
        
        res.json(frappeResponse({ message: "Chapter deleted successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'ChapterControllerError');
    }
};

exports.updateChapterIndex = async (req, res) => {
    try {
        let { chapter, idx } = req.body;
        
        if (Array.isArray(req.body)) {
            await Promise.all(req.body.map(async (item) => {
                await Chapter.updateOne({ name: item.name }, { $set: { idx: item.idx } });
            }));
        } else if (typeof chapter === 'object') {
             await Chapter.updateOne({ name: chapter.name }, { $set: { idx: chapter.idx } });
        } else {
             await Chapter.updateOne({ name: chapter }, { $set: { idx } });
        }
        
        res.json(frappeResponse({ message: "Index updated successfully" }));
    } catch (error) {
        sendFrappeError(res, error, 'ChapterControllerError');
    }
};
