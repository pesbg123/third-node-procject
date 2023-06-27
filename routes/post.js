const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const { Users, Posts } = require('../models');
const { Op } = require('sequelize');

// 전체 게시글 조회 API
router.get('/posts', async (req, res) => {
  try {
    const posts = await Posts.findAll({
      order: [['createdAt', 'desc']],
    });

    // 게시물의 존재 여부를 확인합니다.
    if (!posts || posts.length === 0) {
      res.status(404).json({ error: '존재하는 게시물이 없습니다.' });
      return; // 추가된 return 문을 통해 함수 실행 종료
    }

    // 조회한 게시물들을 응답합니다.
    res.json({ data: posts });
  } catch (error) {
    // 오류가 발생한 경우 오류 메시지를 응답합니다.
    res.status(500).json({ error: '게시물 조회에 실패했습니다.' });
  }
});

// 게시글 작성 API (로그인 한 사용자만 작성할 수 있게 authMiddleware사용)
router.post('/posts', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const { user } = res.locals;

  // 새로운 게시물을 생성합니다.
  const createdPosts = await Posts.create({
    UserId: user.userId,
    title,
    content,
  });

  // 확인 메시지를 응답합니다.
  res.json({ posts: '게시물을 생성하였습니다.' });
});

// 게시글 상세 조회 API
router.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    // MongoDB에서 해당 postId을 가진 게시물을 조회합니다.
    const post = await Posts.findOne({ where: { postId } });

    // 게시물의 존재 여부를 확인합니다.
    if (!post || post.length === 0) {
      // 게시물이 존재하지 않을 경우 에러 응답을 보냅니다.
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 조회된 게시물을 응답합니다.
    res.json({ data: post });
  } catch (error) {
    // 오류가 발생한 경우 오류 메시지를 응답합니다.
    res.status(500).json({ error: '게시물 조회에 실패했습니다.' });
  }
});

// 게시글 수정 API (로그인 한 사용자만 수정할 수 있게 authMiddleware사용)
router.patch('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;
  const { user } = res.locals;

  try {
    // postId를 기준으로 해당하는 게시물의 존재 여부를 확인합니다.
    const post = await Posts.findOne({ where: { postId } });

    if (!post) {
      // 게시물이 존재하지 않을 경우 에러 응답을 보냅니다.
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 사용자 본인이 작성한 게시물인지 검사합니다.
    if (user.userId !== post.UserId) {
      return res.status(400).json({ error: '접근이 허용되지 않습니다.' });
    }

    // 게시물을 업데이트합니다.
    if (title) {
      await post.update({ title });
    }
    if (content) {
      await post.update({ content });
    }

    // 확인 메시지를 응답합니다.
    res.json({ message: '게시물 수정에 성공했습니다.' });
  } catch (error) {
    // 오류가 발생한 경우 오류 메시지를 응답합니다.
    res.status(500).json({ error: '게시물 수정에 실패했습니다.' });
  }
});

// // 게시글 삭제 API (로그인 한 사용자만 삭제할 수 있게 authMiddleware사용)
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { user } = res.locals;

  try {
    // postId를 기준으로 해당하는 게시물의 존재 여부를 확인합니다.
    const post = await Posts.findOne({ where: { postId } });

    if (!post) {
      // 게시물이 존재하지 않을 경우 에러 응답을 보냅니다.
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 사용자 본인이 작성한 게시물인지 검사합니다.
    if (user.userId !== post.UserId) {
      return res.status(400).json({ error: '접근이 허용되지 않습니다.' });
    }

    // 게시물을 삭제합니다.
    await post.destroy({
      where: {
        [Op.and]: [{ postId: post.PostId }, { UserId: post.UserId }],
      },
    });

    // 확인 메시지를 응답합니다.
    res.json({ message: '게시물 삭제에 성공했습니다.' });
  } catch (error) {
    // 오류가 발생한 경우 오류 메시지를 응답합니다.
    res.status(500).json({ error: '게시물 삭제에 실패했습니다.' });
  }
});

module.exports = router; // router 모듈을 외부로 내보냅니다.
