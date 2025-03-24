# Contributing to Tagore Speaks

Thank you for your interest in contributing to Tagore Speaks! This document provides guidelines and instructions for contributing to this project.

## 🌟 Ways to Contribute

There are many ways you can contribute to Tagore Speaks:

1. **Code Contributions**: Implement new features or fix bugs
2. **Content Contributions**: Add to the database of Tagore's works
3. **Documentation**: Improve or expand documentation
4. **Bug Reports**: Submit detailed bug reports
5. **Feature Requests**: Suggest new features or improvements
6. **UI/UX Improvements**: Enhance the user interface and experience
7. **Translation**: Help make the app available in more languages, especially Bengali

## 🚀 Getting Started

### Setting Up Your Development Environment

1. **Fork the repository** to your GitHub account
2. **Clone your fork** to your local machine
    ```bash
    git clone https://github.com/your-username/tagore-speaks.git
    cd tagore-speaks
    ```
3. **Set up the project** by following the installation instructions in the README.md
4. **Create a new branch** for your contribution
    ```bash
    git checkout -b feature/your-feature-name
    ```

### Development Workflow

1. **Make your changes** in your branch
2. **Test your changes** thoroughly
3. **Commit your changes** with clear, descriptive commit messages
    ```bash
    git commit -m "Add feature: description of the feature"
    ```
4. **Push your branch** to your fork
    ```bash
    git push origin feature/your-feature-name
    ```
5. **Create a Pull Request** against the main repository

## 📋 Contribution Guidelines

### Code Style

#### Frontend (React/TypeScript)

-   Follow the existing code style and organization
-   Use TypeScript for type safety
-   Follow React best practices and hooks pattern
-   Use Tailwind CSS for styling
-   Run ESLint before submitting your PR: `npm run lint`

#### Backend (Python)

-   Follow PEP 8 style guide
-   Add docstrings to functions and classes
-   Use type hints where applicable
-   Keep functions small and focused
-   Run tests before submitting your PR

### Git Workflow

-   Keep your commits focused on a single task
-   Rebase your branch on main before submitting a PR
-   Squash multiple commits if they address the same issue
-   Use descriptive commit messages that explain why the change was made

### Pull Request Process

1. Create a PR with a clear title and description
2. Link any related issues
3. Ensure all tests pass
4. Request a review from a maintainer
5. Address any feedback provided in the review
6. Once approved, your PR will be merged

## 🧠 Contributing to the Tagore Database

If you want to add more of Tagore's works to the database:

1. Ensure the content is properly translated and in the public domain
2. Use the provided `manage_creations.py` script to add content:
    ```bash
    cd tagore-data
    python manage_creations.py
    ```
3. Follow the prompts to categorize and add the work
4. Document the sources of the content you're adding

## 🐞 Reporting Bugs

When reporting bugs, please include:

1. A clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Environment details (browser, OS, etc.)

Use the GitHub issue tracker to report bugs.

## 💡 Suggesting Features

Feature suggestions are welcome! When suggesting features:

1. Check if the feature has already been suggested
2. Provide a clear description of the feature
3. Explain the benefit of the feature
4. Consider implementation details if possible

Use the GitHub issue tracker to suggest features.

## 📜 Adding to Tagore's Works Collection

We aim to build a comprehensive collection of Tagore's works. When contributing content:

1. Ensure the content is accurately attributed to Tagore
2. Verify the translation quality (if applicable)
3. Include metadata such as original publication date and source
4. Follow the formatting guidelines in the data management tools

## 🔄 Continuous Integration

We use GitHub Actions for continuous integration. Your PR will be automatically tested. Please ensure that:

1. All tests pass
2. No linting errors are present
3. The application builds successfully

## 📝 License

By contributing to Tagore Speaks, you agree that your contributions will be licensed under the project's MIT License.

## 🤝 Code of Conduct

Please note that this project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 📢 Communication

-   Use GitHub Issues for bug reports and feature requests
-   For major changes, please open an issue first to discuss what you would like to change
-   For questions, reach out to the maintainers directly

Thank you for contributing to Tagore Speaks! Your efforts help bring the wisdom of Rabindranath Tagore to people around the world.
