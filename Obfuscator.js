
export function obfuscate(source) {
    const bytes = Array.from(new TextEncoder().encode(source));
    const list = bytes.join(",");

    return `-- RedstoneGuard basic encoded loader
local data = {${list}}
local chars = {}

for i = 1, #data do
    chars[i] = string.char(data[i])
end

local source = table.concat(chars)
local runner = loadstring or load

if not runner then
    error("Dynamic loading is not supported")
end

local fn, err = runner(source)

if not fn then
    error(err)
end

return fn()
`;
}
