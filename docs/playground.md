---
layout: page
title: Playground
description: Interactive playground to explore collect-ts methods
---

<script setup>
import Playground from './.vitepress/theme/components/Playground/Playground.vue'
</script>

<div class="playground-page">

<h1 class="playground-title">Playground</h1>
<p class="playground-description">Experiment with collect-ts in your browser. Type code on the left, see results on the right.</p>

<div class="playground-wrapper">
<Playground />
</div>

</div>

<style>
.playground-page {
	max-width: 1400px;
	margin: 0 auto;
	padding: 32px 24px 48px;
}

.playground-title {
	margin: 0 0 8px;
	font-size: 28px;
	font-weight: 700;
	letter-spacing: -0.02em;
}

.playground-description {
	margin: 0 0 24px;
	font-size: 16px;
	color: var(--vp-c-text-2);
}

.playground-wrapper {
	margin-top: 0;
}

@media (min-width: 768px) {
	.playground-page {
		padding: 40px 32px 64px;
	}
	
	.playground-title {
		font-size: 32px;
	}
	
	.playground-description {
		margin-bottom: 32px;
	}
}

@media (min-width: 1024px) {
	.playground-page {
		padding: 48px 48px 80px;
	}
}

@media (min-width: 1280px) {
	.playground-page {
		padding: 56px 64px 96px;
	}
}
</style>
