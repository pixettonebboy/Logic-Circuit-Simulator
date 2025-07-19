const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let blocks = [];
let selectedBlock = null;
let connectSource = null;

const logicFunctions = {
  AND: (inputs) => inputs.every((v) => v === 1) ? 1 : 0,
  OR: (inputs) => inputs.some((v) => v === 1) ? 1 : 0,
  NOT: (inputs) => inputs[0] === 1 ? 0 : 1,
  XOR: (inputs) => inputs.reduce((a, b) => a ^ b, 0),
  NAND: (inputs) => !(inputs.every((v) => v === 1)) ? 1 : 0,
  NOR: (inputs) => !(inputs.some((v) => v === 1)) ? 1 : 0,
  XNOR: (inputs) => !(inputs.reduce((a, b) => a ^ b, 0)) ? 1 : 0
};

class Block {
  constructor(type, x, y) {
    this.id = blocks.length;
    this.type = type;
    this.x = x;
    this.y = y;
    this.inputs = [];
    this.value = null;
  }

  draw() {
    const width = 130;
    const height = 70;
    // Rettangolo arrotondato
    const radius = 15;
    ctx.fillStyle = (this === selectedBlock) ? "#5066bb" : "#555577";
    ctx.strokeStyle = (this === selectedBlock) ? "#aabbff" : "#ccccff";
    ctx.lineWidth = 3;
    roundRect(ctx, this.x, this.y, width, height, radius, true, true);

    // Testo centrato verticalmente
    ctx.fillStyle = "white";
    ctx.font = "18px Segoe UI, Tahoma, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`${this.type} (${this.id})`, this.x + 40, this.y + height/2);

    // Pallino stato a sinistra
    let stateColor = "gray";
    if (this.value === 1) stateColor = "limegreen";
    else if (this.value === 0) stateColor = "crimson";
    ctx.beginPath();
    ctx.fillStyle = stateColor;
    ctx.arc(this.x + 20, this.y + height/2, 13, 0, Math.PI * 2);
    ctx.fill();

    // Disegna linee connessioni
    this.inputs.forEach(inputId => {
      const src = blocks[inputId];
      const color = src.value === null ? "gray" : src.value === 1 ? "limegreen" : "crimson";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(src.x + width, src.y + height/2);
      ctx.lineTo(this.x, this.y + height/2);
      ctx.stroke();
    });
  }
}

function addBlock(type) {
  blocks.push(new Block(type, 100 + Math.random() * 800, 100 + Math.random() * 600));
  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  blocks.forEach(block => block.draw());
}

function getBlockAt(x, y) {
  return blocks.find(b => {
    const width = 130;
    const height = 70;
    return x >= b.x && x <= b.x + width && y >= b.y && y <= b.y + height;
  });
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const b = getBlockAt(x, y);
  if (b) {
    if (connectSource === null) {
      connectSource = b;
    } else {
      if (b !== connectSource) {
        // Evita collegamenti duplicati
        if (!b.inputs.includes(connectSource.id)) {
          b.inputs.push(connectSource.id);
        }
        connectSource = null;
        simulate();
        render();
        return;
      }
    }
    selectedBlock = b;
  } else {
    selectedBlock = null;
    connectSource = null;
  }
  render();
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons === 1 && selectedBlock) {
    const rect = canvas.getBoundingClientRect();
    selectedBlock.x = e.clientX - rect.left - 65;
    selectedBlock.y = e.clientY - rect.top - 35;
    render();
  }
});

function simulate() {
  blocks.forEach(b => {
    if (b.type === "INPUT0") {
      b.value = 0;
    } else if (b.type === "INPUT1") {
      b.value = 1;
    } else {
      b.value = null;
    }
  });

  function evaluate(block) {
    if (block.value !== null) return block.value;

    if (block.inputs.length === 0) {
      block.value = 0;
      return 0;
    }

    const inputVals = block.inputs.map(i => evaluate(blocks[i]));

    if (logicFunctions[block.type]) {
      block.value = logicFunctions[block.type](inputVals);
    } else if (block.type === "OUTPUT") {
      block.value = inputVals[0];
      alert(`OUTPUT ${block.id} = ${block.value}`);
    } else {
      block.value = 0;
    }

    return block.value;
  }

  for (let b of blocks) {
    evaluate(b);
  }

  render();
}

function deleteSelected() {
  if (!selectedBlock) return;
  const id = selectedBlock.id;
  blocks = blocks.filter(b => b !== selectedBlock);
  blocks.forEach(b => {
    b.inputs = b.inputs.filter(i => i !== id);
  });
  selectedBlock = null;
  connectSource = null;
  render();
}

function resetAll() {
  blocks = [];
  selectedBlock = null;
  connectSource = null;
  render();
}

// Rettangolo arrotondato helper
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}
