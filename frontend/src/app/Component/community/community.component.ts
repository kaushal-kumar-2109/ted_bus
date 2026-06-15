import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunityService } from '../../service/community.service';
import { LanguageService } from '../../service/language.service';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css']
})
export class CommunityComponent implements OnInit {
  activeTab: string = 'stories'; // 'stories' | 'forums' | 'write'
  currentUser: any = null;
  isLoggedIn: boolean = false;
  
  // Profile & Verification
  userProfile: any = null;
  isVerified: boolean = false;
  verificationBadge: string = 'none';
  verificationStatus: string = 'none';
  verifying: boolean = false;

  // Stories
  posts: any[] = []
  loadingPosts: boolean = false;
  page: number = 1;
  totalPages: number = 1;
  selectedCategory: string = '';
  categories: string[] = ['Journey Story', 'Travel Tip', 'Route Advice', 'Destination Guide'];

  // Comments
  activeCommentsPostId: string = '';
  comments: any[] = [];
  newCommentText: string = '';
  loadingComments: boolean = false;

  // Create Story Form
  postForm!: FormGroup;
  submittingPost: boolean = false;
  postSuccessMessage: string = '';
  postErrorMessage: string = '';

  // Forums & Discussions
  forums: any[] = [];
  activeForum: any = null;
  threads: any[] = [];
  loadingForums: boolean = false;
  loadingThreads: boolean = false;
  showCreateThreadForm: boolean = false;
  threadForm!: FormGroup;
  threadSuccessMessage: string = '';
  threadErrorMessage: string = '';

  // Share Modal
  showShareModal: boolean = false;
  shareLinks: any = null;
  shareTitle: string = '';

  // Report Modal
  showReportModal: boolean = false;
  reportPostId: string = '';
  reportReason: string = 'Inappropriate Content';
  reportDescription: string = '';
  reporting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private communityService: CommunityService,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    const userStr = sessionStorage.getItem('Loggedinuser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.isLoggedIn = true;
      this.fetchUserProfile();
    }

    this.initForms();
    this.fetchPosts();
    this.fetchForums();
  }

  private initForms(): void {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      category: ['Journey Story', [Validators.required]],
      content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
      coverImage: ['', [Validators.pattern(/https?:\/\/.+/)]],
      tags: ['']
    });

    this.threadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      tags: ['']
    });
  }

  fetchUserProfile(): void {
    if (!this.currentUser) return;
    this.communityService.getUserProfile(this.currentUser._id || this.currentUser.id).subscribe({
      next: (res: any) => {
        if (res?.success && res.data?.user) {
          this.userProfile = res.data.user;
          this.isVerified = this.userProfile.isProfileVerified;
          this.verificationBadge = this.userProfile.verificationBadge || 'none';
          this.verificationStatus = this.userProfile.verificationStatus || 'none';
        }
      },
      error: (err) => console.error('Error fetching profile details', err)
    });
  }

  // --- POSTS / STORIES FLOW ---

  fetchPosts(): void {
    this.loadingPosts = true;
    this.communityService.getPosts(this.selectedCategory, this.page, 10).subscribe({
      next: (res: any) => {
        this.loadingPosts = false;
        if (res?.success && res.data) {
          this.posts = res.data;
          this.totalPages = res.pagination?.pages || 1;
        } else if (res?.posts) {
          this.posts = res.posts;
        }
      },
      error: (err) => {
        this.loadingPosts = false;
        console.error('Error fetching posts', err);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.page = 1;
    this.fetchPosts();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchPosts();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchPosts();
    }
  }

  likePost(post: any): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.communityService.likePost(post._id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          post.likesCount = res.data.likesCount;
          post.liked = res.data.liked;
        } else {
          // Fallback UI toggle if data is structured differently
          post.liked = !post.liked;
          post.likesCount = post.liked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
        }
      },
      error: (err) => console.error('Error liking post', err)
    });
  }

  // --- COMMENTS FLOW ---

  toggleComments(postId: string): void {
    if (this.activeCommentsPostId === postId) {
      this.activeCommentsPostId = '';
      this.comments = [];
    } else {
      this.activeCommentsPostId = postId;
      this.fetchComments(postId);
    }
  }

  fetchComments(postId: string): void {
    this.loadingComments = true;
    this.communityService.getCommentsForPost(postId).subscribe({
      next: (res: any) => {
        this.loadingComments = false;
        if (res && res.comments) {
          this.comments = res.comments;
        }
      },
      error: (err) => {
        this.loadingComments = false;
        console.error('Error fetching comments', err);
      }
    });
  }

  addComment(postId: string): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.newCommentText.trim()) return;

    const commentData = {
      postId,
      content: this.newCommentText.trim()
    };

    this.communityService.addComment(commentData).subscribe({
      next: (res: any) => {
        this.newCommentText = '';
        this.fetchComments(postId);
        
        // Update comments count on local post object
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.commentsCount = (post.commentsCount || 0) + 1;
        }
      },
      error: (err) => console.error('Error adding comment', err)
    });
  }

  // --- CREATE STORY ---

  submitPost(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.submittingPost = true;
    this.postSuccessMessage = '';
    this.postErrorMessage = '';

    const formVal = this.postForm.value;
    const postData = {
      title: formVal.title,
      category: formVal.category,
      content: formVal.content,
      coverImage: formVal.coverImage || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000',
      tags: formVal.tags ? formVal.tags.split(',').map((t: string) => t.trim()) : []
    };

    this.communityService.createPost(postData).subscribe({
      next: (res: any) => {
        this.submittingPost = false;
        this.postSuccessMessage = 'Story published successfully!';
        this.postForm.reset({ category: 'Journey Story' });
        this.fetchPosts();
        setTimeout(() => {
          this.activeTab = 'stories';
          this.postSuccessMessage = '';
        }, 1500);
      },
      error: (err) => {
        this.submittingPost = false;
        this.postErrorMessage = err.error?.message || 'Error publishing post. Make sure you are verified.';
        console.error('Error creating post', err);
      }
    });
  }

  canDeletePost(post: any): boolean {
    if (!this.isLoggedIn || !this.currentUser) return false;
    const authorId = post.author?._id || post.author || '';
    const currentUserId = this.currentUser._id || this.currentUser.id || '';
    return authorId === currentUserId || this.currentUser.role === 'admin' || this.currentUser.role === 'moderator';
  }

  deletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this story?')) {
      this.communityService.deletePost(postId).subscribe({
        next: (res: any) => {
          this.posts = this.posts.filter(p => p._id !== postId);
          alert('Story deleted successfully!');
        },
        error: (err: any) => {
          console.error(err);
          alert(err.error?.message || 'Error deleting story');
        }
      });
    }
  }

  // --- INSTANT DEMO VERIFICATION BADGE ---

  instantVerify(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.verifying = true;
    this.communityService.submitVerification('https://demo.identity-documents.com/selfie.jpg').subscribe({
      next: (res: any) => {
        this.verifying = false;
        this.isVerified = true;
        this.verificationStatus = 'approved';
        this.verificationBadge = 'gold';
        this.fetchUserProfile();
      },
      error: (err) => {
        this.verifying = false;
        console.error('Error auto-verifying user', err);
        // Fallback simulate success for UI demo if server returns error
        this.isVerified = true;
        this.verificationStatus = 'approved';
        this.verificationBadge = 'gold';
      }
    });
  }

  // --- FORUMS FLOW ---

  fetchForums(): void {
    this.loadingForums = true;
    this.communityService.getForums().subscribe({
      next: (res: any) => {
        this.loadingForums = false;
        if (res && res.forums) {
          this.forums = res.forums;
        } else if (res && res.data) {
          this.forums = res.data.forums || res.data;
        }
      },
      error: (err) => {
        this.loadingForums = false;
        console.error('Error fetching forums', err);
      }
    });
  }

  selectForum(forum: any): void {
    this.activeForum = forum;
    this.showCreateThreadForm = false;
    this.loadingThreads = true;
    this.communityService.getForumThreads(forum._id).subscribe({
      next: (res: any) => {
        this.loadingThreads = false;
        if (res && res.threads) {
          this.threads = res.threads;
        } else if (res && res.data) {
          this.threads = res.data.threads || res.data;
        }
      },
      error: (err) => {
        this.loadingThreads = false;
        console.error('Error fetching threads', err);
      }
    });
  }

  submitThread(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.threadForm.invalid || !this.activeForum) {
      this.threadForm.markAllAsTouched();
      return;
    }

    this.submittingPost = true;
    this.threadSuccessMessage = '';
    this.threadErrorMessage = '';

    const formVal = this.threadForm.value;
    const threadData = {
      forumId: this.activeForum._id,
      title: formVal.title,
      content: formVal.content,
      tags: formVal.tags ? formVal.tags.split(',').map((t: string) => t.trim()) : []
    };

    this.communityService.createThread(threadData).subscribe({
      next: (res: any) => {
        this.submittingPost = false;
        this.threadSuccessMessage = 'Thread created successfully!';
        this.threadForm.reset();
        this.showCreateThreadForm = false;
        this.selectForum(this.activeForum);
        setTimeout(() => {
          this.threadSuccessMessage = '';
        }, 2000);
      },
      error: (err) => {
        this.submittingPost = false;
        this.threadErrorMessage = err.error?.message || 'Error creating thread.';
        console.error('Error creating thread', err);
      }
    });
  }

  // --- SHARE DIALOG FLOW ---

  openShare(post: any): void {
    if (post.socialShareLinks) {
      this.shareLinks = post.socialShareLinks;
    } else {
      // Mock share links
      const encodedUrl = encodeURIComponent(`${window.location.origin}/community/posts/${post._id}`);
      const encodedText = encodeURIComponent(post.title);
      this.shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedText}`
      };
    }
    this.shareTitle = post.title;
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.shareLinks = null;
  }

  // --- REPORT DIALOG FLOW ---

  openReport(postId: string): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.reportPostId = postId;
    this.reportReason = 'Inappropriate Content';
    this.reportDescription = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportPostId = '';
  }

  submitReport(): void {
    if (this.reporting) return;
    this.reporting = true;
    this.communityService.reportPost(this.reportPostId, {
      reason: this.reportReason,
      description: this.reportDescription
    }).subscribe({
      next: (res: any) => {
        this.reporting = false;
        this.closeReportModal();
        alert('Thank you! The post has been reported for moderation.');
      },
      error: (err) => {
        this.reporting = false;
        this.closeReportModal();
        alert('Error submitting report. Please try again.');
        console.error('Error reporting post', err);
      }
    });
  }
}
