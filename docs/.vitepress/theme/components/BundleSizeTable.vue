<script setup lang="ts">
import bundleSizes from '../data/bundle-sizes.json';
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Approach</th>
        <th>Size (gzip)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Full library</td>
        <td>{{ bundleSizes.full.formatted }}</td>
      </tr>
      <tr>
        <td>Plugin (5 methods)</td>
        <td>{{ bundleSizes.treeshaken.formatted }}</td>
      </tr>
      <tr>
        <td>Manual (2 methods)</td>
        <td>~1 KB</td>
      </tr>
      <tr>
        <td>Standalone function</td>
        <td>{{ bundleSizes.standalone.formatted }} each</td>
      </tr>
    </tbody>
  </table>
</template>
