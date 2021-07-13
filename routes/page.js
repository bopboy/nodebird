const express = require('express')
const router = express.Router()
const { User, Post, Hashtag } = require('../models')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')

router.use((req, res, next) => {
    res.locals.user = req.user
    res.locals.followerCount = req.user ? req.user.Followers.length : 0
    res.locals.followingCount = req.user ? req.user.Followings.length : 0
    res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : []
    next()
})
router.get('/profile', isLoggedIn, (req, res) => { res.render('profile', { title: '내 프로파일' }) })
router.get('/join', isNotLoggedIn, (req, res) => { res.render('join', { title: '회원가입' }) })
router.get('/', async (req, res, next) => {
    // const twits = []
    try {
        const posts = await Post.findAll({
            include: {
                model: User,
                attributes: ['id', 'nick']
            },
            order: [['createdAt', 'DESC']]
        })
        res.render('main', { title: '노드버드', twits: posts })
    } catch (err) {
        console.error(err)
        next(err)
    }
})
router.get('/hashtag', async (req, res, next) => {
    const query = req.query.hashtag
    if (!query) return res.redirect('/')
    try {
        const hashtag = await Hashtag.findOne({ where: { title: query } })
        let posts = []
        if (hashtag) posts = await hashtag.getPosts({ include: [{ model: User, attributes: ['id', 'nick'] }] })
        return res.render('main', { title: `#${query} 검색 결과 | Nodebird`, twits: posts })
    } catch (err) {
        console.error(err)
        next(err)
    }
})
module.exports = router