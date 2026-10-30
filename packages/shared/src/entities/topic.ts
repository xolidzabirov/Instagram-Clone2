/** Interest topic of «Ваш алгоритм» */
export interface Topic {
  id: string;
  slug: string;
  nameRu: string;
  nameEn: string;
}

export interface UserTopic {
  topic: Topic;
  /** -1 (show less) … 1 (show more) */
  weight: number;
  /** AUTO grows from likes and reposts; MANUAL was set by the user and is never auto-changed */
  source: "AUTO" | "MANUAL";
}
