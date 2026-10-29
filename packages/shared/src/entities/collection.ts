/** Named folder of saved posts */
export interface Collection {
  id: string;
  name: string;
  /** Thumbnail of the most recently saved post */
  cover: string | null;
  postsCount: number;
  createdAt: string;
}
