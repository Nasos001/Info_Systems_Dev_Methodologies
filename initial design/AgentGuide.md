## Agentic Workflow Setup

### Setup

- Go to the OpenCode website: `https://opencode.ai/`, and download terminal OpenCode through a command (I prefer the npm command (assuming node.js is installed) )
- Go to the Ollama Cloud Website: `https://ollama.com/settings/keys` and create an account.
- After creating the account, click the `Generate new API Key`.
- Save that key in a file.

### Terminal

- Create a file directory where the project should be and open a terminal there (`cmd` + enter on the uri of the folder).
- Enter command `opencode auth login`
- Choose `Ollama Cloud` as the provider (You can search it by typing starting to type it)
- When prompted, insert the API Key obtained from Ollama.
- Launch OpenCode by typing the command: "opencode"

### Bugs

- You may get an `Unauthorized` Error when prompting for the first time. In that case type `/connect` in the opencode input, select Ollama Cloud and paste the API Key again.

### Important

- Ollama Cloud has some limits on the free tier. There is a session limit (which resets after 5 hours) and the weekly limit (which resets every Monday), you can monitor your usage here: `https://ollama.com/settings`
