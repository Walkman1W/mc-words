// Video Data Module
// Handles loading and managing video data

const DEFAULT_VIDEOS = {
  videos: [],
  categories: [
    { id: 'all', label: 'All' },
    { id: 'tutorial', label: 'Tutorials' },
    { id: 'build', label: 'Builds' },
    { id: 'redstone', label: 'Redstone' },
    { id: 'survival', label: 'Survival' }
  ]
};

class VideoData {
  constructor() {
    this.data = null;
    this.currentCategory = 'all';
  }

  async load() {
    try {
      // Try to load from manifest
      const response = await fetch('assets/videos/manifest.json');
      if (response.ok) {
        this.data = await response.json();
      } else {
        // Use default empty state
        this.data = DEFAULT_VIDEOS;
      }
    } catch (e) {
      console.log('Using default video data');
      this.data = DEFAULT_VIDEOS;
    }
    return this.data;
  }

  getVideos(category = 'all') {
    if (!this.data || !this.data.videos) return [];
    if (category === 'all') return this.data.videos;
    return this.data.videos.filter(v => v.category === category);
  }

  getCategories() {
    return this.data?.categories || DEFAULT_VIDEOS.categories;
  }

  getVideoById(id) {
    if (!this.data || !this.data.videos) return null;
    return this.data.videos.find(v => v.id === id);
  }

  setCategory(category) {
    this.currentCategory = category;
  }
}

export const videoData = new VideoData();
