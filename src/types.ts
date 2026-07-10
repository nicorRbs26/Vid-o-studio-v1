/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MediaType = 'video' | 'image' | 'audio' | 'text';

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds
  thumbnail?: string;
}

export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right';

export interface TimelineClip {
  id: string;
  assetId: string;
  type: MediaType;
  startOffset: number; // Position on timeline in seconds
  startTime: number;   // Start point within the asset in seconds
  duration: number;    // Duration of the clip on timeline
  layer: number;       // Z-index/track
  text?: string;       // For text/subtitle clips
  filter?: string;     // Canvas filter string
  transitionIn?: TransitionType;
  transitionDuration?: number;
  style?: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
}

export interface TimelineState {
  clips: TimelineClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
}
