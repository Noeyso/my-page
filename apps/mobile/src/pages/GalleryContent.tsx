import { useEffect, useState } from 'react';
import {
  useSessionStore,
  fetchAllLikes,
  fetchAllCommentCounts,
  toggleLike,
  fetchComments,
  addComment,
  deleteComment,
  type CommentRow,
} from '@my-page/shared';
import clsx from 'clsx';
import dayjs from 'dayjs';

interface PostData {
  id: number;
  caption: string;
}

const POSTS: PostData[] = [
  { id: 1, caption: '오늘의 한 장 📸' },
  { id: 2, caption: '맛있는 점심 🍜' },
  { id: 3, caption: '산책 중 발견한 풍경 🌿' },
  { id: 4, caption: '작업 중... 💻' },
  { id: 5, caption: '주말 나들이 ☀️' },
  { id: 6, caption: '오늘도 화이팅! 💪' },
];

const POST_IDS = POSTS.map((p) => p.id);

interface LikeState {
  count: number;
  likedByMe: boolean;
}

export default function GalleryContent() {
  const nickname = useSessionStore((s) => s.nickname);
  const [likes, setLikes] = useState<Record<number, LikeState>>({});
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchAllLikes(POST_IDS).then(setLikes).catch(() => {});
    fetchAllCommentCounts(POST_IDS).then(setCommentCounts).catch(() => {});
  }, []);

  const handleLike = async (postId: number) => {
    const likedByMe = await toggleLike(postId);
    setLikes((prev) => {
      const current = prev[postId] ?? { count: 0, likedByMe: false };
      return {
        ...prev,
        [postId]: {
          count: likedByMe ? current.count + 1 : Math.max(0, current.count - 1),
          likedByMe,
        },
      };
    });
  };

  const handleOpenComments = async (post: PostData) => {
    setSelectedPost(post);
    const data = await fetchComments(post.id);
    setComments(data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    const comment = await addComment(selectedPost.id, newComment.trim());
    setComments((prev) => [...prev, comment]);
    setCommentCounts((prev) => ({
      ...prev,
      [selectedPost.id]: (prev[selectedPost.id] ?? 0) + 1,
    }));
    setNewComment('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCounts((prev) => ({
      ...prev,
      [selectedPost.id]: Math.max(0, (prev[selectedPost.id] ?? 1) - 1),
    }));
  };

  if (selectedPost) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b border-[#3f5f88]">
          <button onClick={() => setSelectedPost(null)} className="text-[#dbedff] text-lg">◀</button>
          <span className="text-sm font-bold text-[#dbedff]">댓글</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="mobile-card p-3">
            <p className="text-sm font-bold text-[#dbedff]">{selectedPost.caption}</p>
          </div>

          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="p-3 bg-[#132247] border border-[#3f5f88]">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-[#dbedff]">{c.nickname}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#5f7ca3]">
                      {dayjs(c.created_at).format('MM.DD HH:mm')}
                    </span>
                    {c.nickname === nickname && (
                      <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-red-400" aria-label="삭제">✕</button>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-1 text-[#a6bed8]">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm text-[#5f7ca3] py-4">댓글이 없습니다</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-3 border-t border-[#3f5f88]">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="댓글을 입력하세요..."
            className="mobile-input flex-1"
          />
          <button onClick={handleAddComment} className="mobile-btn text-sm px-4">등록</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-3">
        {POSTS.map((post) => {
          const likeState = likes[post.id];
          const commentCount = commentCounts[post.id] ?? 0;

          return (
            <div key={post.id} className="mobile-card overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-[#1a2f5b] to-[#27457d] flex items-center justify-center text-4xl">
                📷
              </div>
              <div className="p-2">
                <p className="text-xs truncate mb-2 text-[#a6bed8]">{post.caption}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={clsx('text-sm min-h-[36px]', likeState?.likedByMe ? 'text-red-400' : 'text-[#5f7ca3]')}
                    aria-label={likeState?.likedByMe ? '좋아요 취소' : '좋아요'}
                  >
                    {likeState?.likedByMe ? '❤️' : '🤍'} {likeState?.count ?? 0}
                  </button>
                  <button
                    onClick={() => handleOpenComments(post)}
                    className="text-sm text-[#5f7ca3] min-h-[36px]"
                    aria-label="댓글"
                  >
                    💬 {commentCount}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
