/// <reference types="chrome"/>
import { Category, Project } from '../types';
import { Goal } from '../types/goals';

export const storage = {
  async getProjects(): Promise<Project[]> {
    const result = await chrome.storage.local.get('projects');
    return result.projects || [];
  },

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const projects = await this.getProjects();
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    await chrome.storage.local.set({ projects });
  },

  async getCategories(): Promise<Category[]> {
    const result = await chrome.storage.local.get('categories');
    return result.categories || [];
  },

  async addCategory(category: Omit<Category, 'id'>): Promise<void> {
    const categories = await this.getCategories();
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID()
    };
    categories.push(newCategory);
    await chrome.storage.local.set({ categories });
  },

  async cleanStorage(): Promise<void> {
    await chrome.storage.local.clear();
  },

  async saveGoals(goals: Goal[]): Promise<void> {
    await chrome.storage.local.set({ goals });
  },

  async getGoals(): Promise<Goal[]> {
    const result = await chrome.storage.local.get('goals');
    return result.goals || [];
  },

  async setOnboardingComplete(complete: boolean): Promise<void> {
    await chrome.storage.local.set({ onboardingComplete: complete });
  },

  async isOnboardingComplete(): Promise<boolean> {
    const result = await chrome.storage.local.get('onboardingComplete');
    return result.onboardingComplete || false;
  },

  async cleanTasks(): Promise<void> {
    await chrome.storage.local.remove([
      'currentSession',
      'archivedSessions',
      'goals',
      'onboardingComplete'
    ]);
  }
}; 