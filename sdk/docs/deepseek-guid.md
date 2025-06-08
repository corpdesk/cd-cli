# DeepSeek API Integration Guide

## Model Specifications

### `deepseek-chat` vs. `deepseek-coder`

| Feature              | `deepseek-chat`          | `deepseek-coder`                         |
|----------------------|--------------------------|------------------------------------------|
| **Purpose**          | General-purpose conversations | Code-specific tasks                 |
| **Training Data**    | General text corpus      | Code + technical documentation           |
| **Optimal Use Cases**| Natural language Q&A,    |                                          |
|                      | content generation       | Code generation, debugging, optimization |
| **Token Limits**     | Standard (4K-32K)        | Extended for code contexts               |
| **Pricing**          | Lower cost               | Premium for specialized performance      |

## Access Requirements

- **No pre-qualification needed**  
  Simply specify the model in your API request:
  ```json
  {
    "model": "deepseek-coder",
    "messages": [
      {"role": "user", "content": "Your coding prompt here"}
    ]
  }

## Pricing Structure
| Model	          | Input Tokens	    | Output Tokens
|-----------------|---------------------|------------
| deepseek-chat	  | $0.50 per 1M tokens	| $1.50 per 1M tokens
| deepseek-coder  | $1.00 per 1M tokens	| $2.00 per 1M tokens

