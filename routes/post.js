const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const { isLoggedIn } = require('./middlewares')
const { Post, Hashtag } = require('../models')


try {
    fs.readdirSync('uploads')
} catch (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
    fs.mkdirSync('uploads')
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) { cb(null, 'uploads/') },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname)
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext)
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
})

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file)
    res.json({ url: `/img/${req.file.filename}` })
})

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id
        })
        const hashtags = req.body.content.match(/#[^\s#]*/g)
        if (hashtags) {
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({
                        where: { title: tag.slice(1).toLowerCase() }
                    })
                })
            )
            console.log(result)
            await post.addHashtags(result.map(r => r[0]))
        }
        res.redirect('/')
    } catch (err) {
        console.error(err)
        next(err)
    }
})
module.exports = router