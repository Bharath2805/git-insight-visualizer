const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, repoData, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Construct the prompt with repository context
        let prompt = `You are an AI assistant that helps analyze GitHub repositories. `;
        
        if (repoData) {
            prompt += `You're currently analyzing the repository "${repoData.fullName}" which is described as: "${repoData.description}". `;
        }
        
        if (context && context.selectedNode) {
            const node = context.selectedNode;
            if (node.type === 'file') {
                prompt += `The user has selected a ${node.language} file named "${node.id}". `;
                if (node.outdated) {
                    prompt += `This file contains outdated dependencies. `;
                }
            } else {
                prompt += `The user has selected a folder named "${node.id}". `;
            }
        }
        
        prompt += `\nUser question: ${message}\n\nPlease provide a helpful, technical, yet easy-to-understand response.`;
        prompt+= `\ndeal in a friendly way and polite way if users asks to build from scratch guide him ste by step  `
        
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { "role": "system", "content": prompt },
                { "role": "user", "content": message }
            ],
            max_tokens: 1000
        });
        
        // Extract the response
        const response = completion.choices[0].message.content;
        
        res.json({ response });
    } catch (error) {
        console.error('Error getting AI response:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// Explain file endpoint
router.post('/explain-file', async (req, res) => {
    try {
        const { filePath, fileContent, detailed } = req.body;
        
        if (!filePath || !fileContent) {
            return res.status(400).json({ error: 'File path and content are required' });
        }
        
        // Construct the prompt
        let prompt = `You are an expert code reviewer and technical educator. `;
        prompt += `Please ${detailed ? 'provide a detailed line-by-line explanation' : 'summarize'} of the following code file: "${filePath}"\n\n`;
        
        if (detailed) {
            prompt += `Break down each section of the code, explain what it does, and highlight any important patterns or best practices. `;
            prompt += `Focus on clarity and educational value. Format your response with line numbers when relevant.\n\n`;
        } else {
            prompt += `Provide a concise summary of what this file does, its main functionality, and any notable features. `;
            prompt += `Highlight key patterns, potential issues, and best practices. Format your response with bullet points where appropriate.\n\n`;
        }
        
        prompt += `Here's the code:\n${fileContent}`;
        
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { "role": "system", "content": prompt }
            ],
            max_tokens: 1500
        });
        
        // Extract the explanation
        const explanation = completion.choices[0].message.content;
        
        res.json({ explanation });
    } catch (error) {
        console.error('Error getting file explanation:', error);
        res.status(500).json({ error: 'Failed to get file explanation' });
    }
});

module.exports = router;