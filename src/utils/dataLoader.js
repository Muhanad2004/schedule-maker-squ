import coursesData from '../data/courses.json';

/**
 * Loads the static course data.
 * In a real app this might be an async fetch, but here we import the JSON directly.
 * @returns {Promise<Array>} List of courses
 */
export const loadCourses = async () => {
    // Simulating async behavior in case we want to switch to fetch later
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(coursesData);
        }, 100);
    });
};
